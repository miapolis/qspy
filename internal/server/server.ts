import path from 'path'
import http from 'http';
import express from 'express';
import websocket from 'websocket';
import apiRouter from './routes/api-router';
import roomRouter from './routes/room-router';
import { ClientPacket, WSQuery } from '../protocol';
import * as protocol from '../protocol';
import * as metrics from './metrics';
import bodyParser from 'body-parser';
import { Mutex } from 'async-mutex';
import { v4 as uuidv4 } from 'uuid';

import { Room as GameRoom } from '../game/room';
import { server as appServer } from '../main';

const PORT = process.env.PORT || 5000;
const app = express();
export const server = http.createServer(app);

export const MAX_ROOM_MEMBER_COUNT = 20;
export const MAX_ROOMS = 1000;
export const PRUNE_INTERVAL = 3 * 60000;
export const PRUNE_AGE = 12 * 60000;

const wss = new websocket.server({
    httpServer: server,
    autoAcceptConnections: false,
});

export class Server {
    private clientCount:number;
    private roomCount:number;
    private rooms:Map<string, Room>;
    private roomIDs:Map<string, Room>;

    private mutex:Mutex;

    constructor() {
        this.clientCount = 0;
        this.roomCount = 0;

        this.rooms = new Map<string, Room>();
        this.roomIDs = new Map<string, Room>();
        this.mutex = new Mutex();

        this.Run();
    }

    public async CreateRoom (name:string):Promise<[Room?, string?]> {
        const release = await this.mutex.acquire();
        try {
            if (this.roomCount > MAX_ROOMS) return [undefined, 'Too many rooms.'];
            if (this.rooms.has(name)) return [undefined, 'Room already exists.'];
            
            const room = new Room(name);
            this.rooms.set(name, room);
            this.roomIDs.set(room.GetID(), room);
            
            let search = this.rooms.get(name);
            if (search) { 
                this.roomCount++;
                metrics.NewRoom();
                return [room, undefined] 
            }
            
            return [undefined, 'Unknown error.'];
        } finally { release(); }
    }

    public async FindRoom (name: string):Promise<Room | undefined> {
        const release = await this.mutex.acquire();
        try {
            return this.rooms.get(name);
        } finally { release(); }
    }

    private Run () {
        setInterval(() => {
            this.Prune();
        }, PRUNE_INTERVAL);
    }

    private async Prune () {
        const release = await this.mutex.acquire();
        try {
            const toRemove = new Array<string>();
            this.rooms.forEach((room) => {
                const difference = (new Date().getTime() - room.GetLastSeen().getTime());
                if (difference > PRUNE_AGE) toRemove.push(room.GetID()); // Room is too old
            });
            if (toRemove.length === 0) { return; }
            for (let i = 0; i < toRemove.length; i++) {
                const roomID = toRemove[i];
                const room = this.roomIDs.get(roomID);
                if (!room) continue;

                this.rooms.delete(room.GetName());
                this.roomIDs.delete(roomID);
                room.Cancel();

                metrics.RemoveRoom();
            }
            console.log(`Pruned ${toRemove.length} room(s)`);
        } finally { release(); }
    }

    public ClientCount = () => this.clientCount;
    public RoomCount = () => this.clientCount;
}

export class Room {
    private Name: string;
    private ClientCount: number;
    private ID:string;
    private PlayerIDPool: Array<string>;
    private Players:Map<string, websocket.connection>;
    private LastSeen: Date;

    private mutex:Mutex;

    private GameRoom:GameRoom;

    constructor(name:string) {
        this.Name = name;
        this.ClientCount = 0;
        this.ID = uuidv4();
        this.PlayerIDPool = new Array<string>();
        this.Players = new Map<string, websocket.connection>();
        this.LastSeen = new Date();
        this.mutex = new Mutex();
        
        this.GameRoom = new GameRoom();
    }

    public async GeneratePlayerID (): Promise<string> {
        const release = await this.mutex.acquire();
        try {
            let playerID = uuidv4();
            this.PlayerIDPool.push(playerID);
            return playerID;
        } finally { release(); }
    }

    public async ValidPlayerID (playerID: string): Promise<boolean> {
        const release = await this.mutex.acquire();
        try { return this.PlayerIDPool.includes(playerID); } finally { release(); }
    }

    public async HandleConnection (playerID: string, nickname: string, conn: websocket.connection) {
        const release = await this.mutex.acquire();
        try {
            this.GameRoom.AddPlayer(playerID, nickname.trim(), this.ClientCount == 0); // Make sure nickname is trimmed
            this.ClientCount++;
            this.Players.set(playerID, conn);
            this.LastSeen = new Date();

            metrics.NewClient();

            this.SendToAll(); // Send to all players (including the one that just joined) that a player has joined

            conn.on('message', message => {
                if (!message.utf8Data) { return; }
                let json = JSON.parse(message.utf8Data) as ClientPacket;
                this.LastSeen = new Date();
                this.HandlePacket(playerID, json);
            });

            conn.on('close', async (data) => {
                const release = await this.mutex.acquire();
                try {
                    if (!this.Players.has(playerID)) { return; } 
                    this.RemovePlayer(playerID);
                    this.GameRoom.RemovePlayer(playerID);
                    metrics.RemoveClient();
                    this.SendToAll();
                } finally { release(); }
            });
        } finally { release(); }
    }

    private RemovePlayer (playerID: string) { 
        this.Players.delete(playerID);
        this.PlayerIDPool.splice(this.PlayerIDPool.indexOf(playerID), 1);
        this.ClientCount--;
    }

    private async HandlePacket (playerID: string, packet: ClientPacket) {
        const sender = this.GameRoom.Players.get(playerID);
        if (!sender) { return; }
        
        const release = await this.mutex.acquire();
        try {
            switch(packet.method) {
                case protocol.Method_ChangeNickname:
                { // CHANGE NICKNAME
                    let params = packet.params as protocol.Params_ChangeNickname;
                    // Make sure this is synced with protocol
                    let nickname = params.nickname.trim();
                    if (nickname.length < 0 || nickname.length > 16) return;
                    if (nickname === sender.nickname) return; // We don't need to update if nothing has changed
                    this.GameRoom.ChangeNicknameOfPlayer(playerID, params.nickname);

                    this.SendToAll();
                    break;
                }
                case protocol.Method_KickPlayer:
                { // KICK PLAYER
                    let params = packet.params as protocol.Params_KickPlayer;
                    if (!sender.isHost) return; // Only host can kick other players
                    if (params.discriminator === sender.discriminator) return; // Host cannot kick themselves
                    const player = this.GameRoom.GetPlayerByDiscriminator(params.discriminator); if (!player) { return; }
                    
                    this.Players.get(player.playerID)?.close(1000, protocol.WSC_Reason_Kicked); 
                    // Closing the connection should trigger the OnClose event,
                    // calling SendToAll() notifying everyone that a player has left 
                    break;
                }  
                case protocol.Method_ChangeTime:
                { // CHANGE TIME
                    let params = packet.params as protocol.Params_ChangeTime;
                    if (!sender.isHost) return;
                    if (this.GameRoom.Started || this.GameRoom.IsStarting) return;
                    if (!this.GameRoom.SetNewTime(params.time)) return;

                    this.SendToAll();
                    break;
                }
                case protocol.Method_StartGame: 
                { // START GAME
                    if (!sender.isHost) return;
                    if (this.GameRoom.Players.size < 3) return; // At least three players are required to start a game
                    if (this.GameRoom.IsStarting || this.GameRoom.Started) return;
                    // Proceed
                    this.GameRoom.IsStarting = true; // Let the other players have a heads up
                    this.SendToAll();
                    this.GameRoom.CreateScene(); // Allow preparation for starting game
                    this.GameRoom.StoreStartID(setTimeout(() => {
                        this.GameRoom.StartGame(setTimeout(() => {
                            this.GameRoom.EndGameViaTimer(); // Callback to end the game after the timer runs out
                            this.SendToAll();
                        }, this.GameRoom.TimerLength * 1000));
                        this.SendToAll();
                    }, 5000));
                    break;
                }   
                case protocol.Method_CreateVote:
                { // CREATE VOTE
                    let params = packet.params as protocol.Params_CreateVote;
                    if (!this.GameRoom.Started) return;
                    if (sender.hasCreatedVote) return;
                    if (this.GameRoom.CurrentVote) return; // New votes cannot be created before another has finished
                    if (this.GameRoom.EndGame) return; // Votes cannot be created after the game as ended
                    const target = this.GameRoom.GetPlayerByDiscriminator(params.target);
                    if (!target) return; 
                    this.GameRoom.CreateVote(sender, target);

                    this.SendToAll();
                    break;
                }
                case protocol.Method_Vote:
                { // VOTE
                    let params = packet.params as protocol.Params_Vote;
                    if (!this.GameRoom.Started) return;
                    if (!this.GameRoom.CurrentVote) return; // There needs to be an active vote
                    if (this.GameRoom.CurrentVote.target.discriminator === sender.discriminator) return; // Target cannot vote
                    if (this.GameRoom.CurrentVote.initiator.discriminator === sender.discriminator) return; // Initiator cannot vote
                    if (this.GameRoom.VoteParticipants?.includes(sender)) return; // Players cannot vote more than once
                    this.GameRoom.HandleNewVote(sender, params.agreement);
                    if (this.GameRoom.CalculateVotes()) {
                        setTimeout(() => { // Reveal
                            this.GameRoom.EndVote();
                            this.SendToAll();
                        }, 3000) // Set a short timeout to display the results before moving on
                    } 

                    this.SendToAll();
                    break;
                }
                case protocol.Method_GuessLocation:
                { // GUESS LOCATION
                    let params = packet.params as protocol.Params_GuessLocation;
                    if (!this.GameRoom.Started) return;
                    if (this.GameRoom.CurrentVote) return; // Spy cannot guess when there is a vote (possibly targeted at themselves)
                    if (this.GameRoom.EndGame) return; // Spy cannot guess after the game is already over
                    this.GameRoom.HandleLocationGuess(params.guess);

                    this.SendToAll();
                    break;
                }
                case protocol.Method_PlayAgain:
                { // PLAY AGAIN
                    if (!this.GameRoom.Started) return;
                    if (!this.GameRoom.EndGame) return;
                    if (!sender.isHost) return;

                    this.GameRoom.Reset();
                    this.SendToAll();
                    break;
                }
            }
        }
        catch { }   // Do nothing and wait for the release of the mutex 
                    // Most errors should come from failing to parse the params of bad packets
        finally {
            release();
        }
    }

    private SendToAll () {
        this.Players.forEach((conn, playerID) => {
            this.SendToOne(playerID, conn);
        });
    }

    private SendToOne (playerID: string, conn: websocket.connection) {
        const state = this.CreateRoomStateFor(playerID); // Capture the current state of the game
        const localPlayer = this.GameRoom.Players.get(playerID); if (!localPlayer) return;
        const packet = protocol.NewStatePacket(localPlayer, state);
        conn.send(JSON.stringify(packet));
    }

    private CreateRoomStateFor (playerID: string): protocol.RoomState {
        const player = this.GameRoom.Players.get(playerID);

        let room = this.GameRoom;
        let state:protocol.RoomState = {
            players: new Array<protocol.StatePlayer>(),
            started: room.Started,
            isStarting: room.IsStarting,
            timerLength: room.TimerLength,
            guessSelection: player?.isSpy ? room.GuessSelection : undefined,
            currentLocation: player?.isSpy ? undefined : room.CurrentLocation,
            currentVote: room.CurrentVote,
            endGame: room.EndGame
        };

        room.Players.forEach((player, _) => {
            state.players.push({
                nickname: player.nickname,
                discriminator: player.discriminator,
                isHost: player.isHost,
                score: player.score
            });
        });

        return state;
    }

    public GetID = () => this.ID;
    public GetName = () => this.Name;
    public GetClientCount = () => this.ClientCount;
    public GetLastSeen = () => this.LastSeen;
    public HasStarted = () => this.GameRoom.Started || this.GameRoom.IsStarting;

    public Cancel = () => {
        this.Players.forEach(conn => { conn.close(1000, protocol.WSC_Reason_Room_Close); metrics.RemoveClient(); });
        this.Players.clear();
        this.PlayerIDPool = [];
        this.Name = '';
        this.ClientCount = 0;
        this.ID = '';
        // Let GC (hopefully) do the rest
    }
}

const originIsAllowed = (origin:any): boolean => {
    if (origin === 'http://localhost:5000' || origin === 'https://qspy.xyz') return true
    return false;
}

wss.on('request', async (request:websocket.request) => {
    if (!originIsAllowed(request.origin)) {
        request.reject();
        return;
    }

    const httpReq = request.httpRequest;
    const search = httpReq.url?.substring(httpReq.url.indexOf('?'));
    let roomID, playerID, nickname;
    try { 
        const params = new URLSearchParams(search); 
        roomID = params.get('roomID'); 
        playerID = params.get('playerID');
        nickname = params.get('nickname');
    } catch { request.reject(400); return; }

    if (!roomID || !playerID || !nickname) { request.reject(400); return; }
    const wsQuery = new WSQuery(roomID, playerID, nickname);
    const valid = wsQuery.Valid();
    if (valid[1] === false) { request.reject(400, valid[0]); return; }

    const room = await appServer.FindRoom(roomID);
    if (!room) { request.reject(400); return; }
    if (!await room.ValidPlayerID(playerID)) { request.reject(400); return; }
    if (room.HasStarted()) { request.reject(403); return; }
    if (room.GetClientCount() >= MAX_ROOM_MEMBER_COUNT) { request.reject(403); return; }

    var connection = request.accept('', request.origin);
    room.HandleConnection(playerID, nickname, connection);
});

app.use(bodyParser.json());
// STATIC OUTPUT FROM REACT BUILD
app.use(express.static(path.resolve(__dirname, '../../frontend/build')));
app.use(roomRouter);
app.use(apiRouter);

server.listen(5000, () => { console.log(`Server running on port ${PORT}`); });