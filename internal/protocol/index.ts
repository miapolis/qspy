const RX_LETTERS_NUMBERS_HYPHENS = /^[0-9A-Za-z\s\-]+$/;
const RX_WHITESPACE = /\s/g;

type Discriminator = number;

export class RoomRequest {
    public nickname: string;
    public roomName: string;
    public roomPass: string;
    public create: boolean;

    constructor (nickname: string, roomName: string, roomPass: string, create: boolean) {
        this.nickname = nickname;
        this.roomName = roomName;
        this.roomPass = roomPass;
        this.create = create;
    }

    public Sanitize (): boolean { // Returns whether or not sanitization failed
        try {
            this.nickname = this.nickname.trim();
            this.roomName = this.roomName.trim();
            return true;
        } catch { return false; }
    }
}

export const ValidNickname = (n: string): [string, boolean, number | undefined] => {
    if (n.length === 0) return ['Nickname cannot be empty.', false, 0]; 
    if (n.length > 16) return ['Nickname too long.', false, 0];
    if (!n.replace(RX_WHITESPACE, '').length) return ['Nickname cannot be whitespace.', false, 0];
    return ['', true, undefined];
}

export const ValidRoomRequest = (r: RoomRequest): [string, boolean, number | undefined] => { // Last parameter specifies which input should be marked as incorrect
    const validNickname = ValidNickname(r.nickname);
    if (!validNickname[1]) return validNickname;

    if (r.create) { // Doesn't make sense to display these error messages if the user is looking for a room
        if (r.roomName.length > 20) return ['Room name too long.', false, 1];
        if (!r.roomName.replace(RX_WHITESPACE, '').length) return ['Room name cannot be whitespace.', false, 1]; 
        if (!RX_LETTERS_NUMBERS_HYPHENS.test(r.roomName)) return ['Room name may only contain letters, numbers, and hyphens.', false, 1];
        if (r.roomPass.length > 20) return ['Room password too long.', false, 2];

    }
    return ['', true, undefined];
}

export class JoinRequest { // Strictly for direct-login users
    public nickname: string;
    public roomID: string;

    constructor (nickname: string, roomID: string) {
        this.nickname = nickname;
        this.roomID = roomID;
    }

    public Sanitize (): boolean {
        try {
            this.nickname = this.nickname.trim();
            return true;
        } catch { return false; }
    }
}

export const ValidJoinRequest = (j: JoinRequest): [string, boolean, number | undefined] => {
    const validNickname = ValidNickname(j.nickname);
    if (!validNickname[1]) return validNickname;
    return ['', true, undefined];
}

export interface ClientPacket {
    method: string;
    params: object;
}

///////////////////////////

export const Method_ChangeNickname = 'changeNickname';
export interface Params_ChangeNickname {
    nickname: string;
};

export const Method_KickPlayer = 'kickPlayer';
export interface Params_KickPlayer {
    discriminator: Discriminator;
};

export const Method_StartGame = 'startGame';
export interface Params_StartGame { }; // Not needed but just for definition and consistency's sake

export const Method_CreateVote = 'createVote';
export interface Params_CreateVote {
    target: Discriminator;
}

export const Method_Vote = 'vote';
export interface Params_Vote {
    agreement: boolean;
}

export const Method_GuessLocation = 'guessLocation';
export interface Params_GuessLocation {
    guess: string;
}

export const Method_PlayAgain = 'playAgain';
export interface Params_PlayAgain { };

export const Method_ChangeTime = 'changeTime';
export interface Params_ChangeTime {
    time: number;
}

///////////////////////////

export const WSC_Reason_Kicked = 'KICK';
export const WSC_Reason_Room_Close = 'ROOM_CLOSED';

export interface ServerPacket {
    method: string;
    params: object;
}

export function NewStatePacket(player: object, roomState: RoomState):ServerPacket {
    return {
        method: 'state',
        params: {
            me: player,
            roomState: roomState
        }
    }
}

export interface VoteState {
    initiator: StatePlayer;
    target: StatePlayer;
    votes: { player: StatePlayer, agreement: boolean }[];
    voteCompleted: boolean;
}

export interface EndGameState {
    revealedSpy: StatePlayer | undefined;
    location: string;
    guessedLocation: undefined | string;
    newScores: { player: StatePlayer, addedScore: number }[];
}

export interface RoomState {
    players: Array<StatePlayer>;
    started: boolean;
    isStarting: boolean;
    timerLength: number | undefined;
    guessSelection: string[] | undefined;
    currentLocation: string | undefined;
    currentVote: VoteState | undefined;
    endGame: EndGameState | undefined;
}

export interface LocalPlayer {
    discriminator: Discriminator;
    nickname: string;
    isHost: boolean;
    score: number;
    isSpy: boolean | undefined;
    role: string | undefined;
    hasCreatedVote: boolean | undefined;
    hasVoted: boolean;
}

export interface StatePlayer {
    nickname: string;
    discriminator: Discriminator;
    isHost: boolean;
    score: number;
}

export class WSQuery {
    public roomID: string;
    public nickname: string;

    constructor(roomID: string, nickname: string) {
        this.roomID = roomID.trim();
        this.nickname = nickname.trim();
    }

    public Valid = (): [string, boolean] => {
        if (this.roomID === '') return ['Room ID cannot be empty.', false];
        if (this.nickname.length === 0) return ['Nickname cannot be empty.', false]; 
        if (this.nickname.length > 16) return ['Nickname too long.', false];
        if (!this.nickname.replace(/\s/g, '').length) return ['Nickname cannot be whitespace.', false];
        return ['', true]; 
    }
}