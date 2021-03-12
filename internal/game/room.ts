import { InfoPair } from '../words/words';
import * as packager from '../words/packager';
import { MAX_ROOM_MEMBER_COUNT } from '../server/server';
import { EndGameState, StatePlayer } from '../protocol';

interface WordList {
    Name: string,
    Custom: boolean,
    Data: InfoPair[],
    Enabled: boolean
}

interface Vote {
    initiator: StatePlayer;
    target: StatePlayer;
    votes: { player: StatePlayer, agreement: boolean }[];
    voteCompleted: boolean;
}

export class Room { // Classroom (very funny)
    public Players: Map<string, Player>;
    public WordLists: WordList[];
    public Started: boolean;
    public IsStarting: boolean;
    public Spy: Player | undefined;
    public GuessSelection: string[] | undefined;
    public TimerLength: number;
    public CurrentLocation: string | undefined;
    public CurrentVote: Vote | undefined;
    public VoteParticipants: Player[] | undefined; // Better for lookups
    public EndGame: EndGameState | undefined;
    
    private Discriminators: Map<number, Player>;
    private StartTimerID: NodeJS.Timeout | undefined; // Used for when the game is about to start
    private GameTimerID: NodeJS.Timeout | undefined;

    constructor() {
        this.Players = new Map<string, Player>();
        this.Discriminators = new Map<number, Player>();
        this.Started = false;
        this.IsStarting = false;
        this.TimerLength = 480; // Set default time to 8 minutes
        this.WordLists = GenerateDefaultWordPack();
    }

    public AddPlayer(id: string, nickname: string, isHost: boolean = false) {
        nickname = this.CreateSafeNickname(nickname);
        const discriminator = this.GenerateDiscriminator();
        const player:Player = { 
            playerID: id, 
            discriminator: discriminator, 
            nickname: nickname, 
            isHost: isHost, 
            score: 0,
            isSpy: undefined, 
            role: undefined, 
            hasCreatedVote: undefined,
            hasVoted: false
        };
        this.Players.set(id, player);
        this.Discriminators.set(discriminator, player);
    }

    public ChangeNicknameOfPlayer(id: string, newNickname: string) {
        const player = this.Players.get(id);
        if (!player) return;
        player.nickname = this.CreateSafeNickname(newNickname);
    }

    public RemovePlayer(id: string) {
        const playerToRemove = this.Players.get(id);
        if (playerToRemove === undefined) { throw('Player to remove does not exist!'); } // Uh oh

        this.CancelStart(); // When a player leaves while the game is starting the state is reset
        
        this.Players.delete(id);
        this.Discriminators.delete(playerToRemove.discriminator);
        if (this.Started) { // More involved if a player leaves while there is an ongoing game
            if (playerToRemove.isSpy) {
                if (!this.Spy || !this.CurrentLocation) return;
                const revealedSpy = this.CreateStatePlayer(this.Spy);
                this.EndGame = { 
                    revealedSpy: revealedSpy, 
                    location: this.CurrentLocation, 
                    guessedLocation: undefined,
                    newScores: new Array() 
                };
            } 
            else if (this.Players.size < 3) {
                this.Reset(); // Not enough players to continue the game 
            }
        }

        if (this.CurrentVote) { // Make sure to remove them from the voter list
            const voterToRemove = this.CurrentVote.votes.find(x => x.player.discriminator === playerToRemove.discriminator);
            if (voterToRemove) this.CurrentVote.votes.splice(this.CurrentVote.votes.indexOf(voterToRemove));
            if(this.CalculateVotes()) this.EndVote();
        }

        if (playerToRemove.isHost && this.Players.size > 0) { // Someone else needs to be made the new host
            this.GetRandomPlayer().isHost = true; // Set a random player as the host
        }
    }

    public GetPlayerByName(name: string): Player | undefined {
        for (const [_, player] of Array.from(this.Players.entries())) {
            if (player.nickname === name) return player;
        }
        return undefined;
    }

    public GetPlayerByDiscriminator = (discriminator: number): Player | undefined => {
        return this.Discriminators.get(discriminator);
    }

    public GetRandomPlayer = (): Player => {
        let players = Array.from(this.Players.values());
        return players[Math.floor(Math.random() * players.length)];
    }

    public SetNewTime(time: number): boolean {
        if (time < 300) return false; // Three minutes minimum
        if (time > 600) return false; // Ten minutes maximum
        this.TimerLength = time;
        return true;
    }

    public CreateScene = () => { // Sets a location and assigns each player their role
        const enabledWorldLists = this.WordLists.filter(x => x.Enabled === true);
        if (enabledWorldLists.length === 0) throw('No world list is enabled!'); // Server should prevent from disabling all world lists (at least one needs to be active)
        const wordList = enabledWorldLists[Math.floor(Math.random() * enabledWorldLists.length)];
        const infoPair = wordList.Data[Math.floor(Math.random() * wordList.Data.length)];

        this.Spy = this.GetRandomPlayer();
        this.Spy.isSpy = true; // Set the spy
        this.CurrentLocation = infoPair.Location;
        this.GuessSelection = this.GenerateWordCollection(); // Set the selection that the spy can guess from

        if (infoPair.Roles === undefined) { 
            this.Players.forEach(player => player.role = undefined); // We can include the spy here since it makes no difference (and is more performant)
            return; 
        }

        const original = Array.from(infoPair.Roles);
        let remainingRoles = Array.from(original); // Assign the roles in a manner that minimizes repeats
        this.Players.forEach(player => { 
            // Set common data
            player.hasCreatedVote = false;

            if (player.isSpy) return; // Same as continue in a regular for loop, don't get scared
            if (remainingRoles.length === 0) { // There are more players than roles, and all elements have been exhausted 
                remainingRoles = Array.from(original); // Revert it back to the full selection
            }
            const randomIndex = Math.floor(Math.random() * remainingRoles.length);
            player.role = remainingRoles[randomIndex];
            remainingRoles.splice(randomIndex, 1); // Narrow down the selection for the next player
        });
    }

    private GenerateWordCollection = (): string[] => { // Used for determining what options will be sent to the spy to guess
        if (!this.CurrentLocation) throw('Trying to generate a word collection without having a current location!');
        let words = new Array<InfoPair>();
        this.WordLists.forEach((wordList) => {
            words = words.concat(wordList.Data);
        });
        if (words.length <= 30) { // There are less than 30 outcomes, safe to send all of them
            return words.map(x => x.Location); // Send all of the locations (includes the current location)
        }

        // It's a little bit more involved if we have to reduce the selection to 30
        // We use 29 here because we need to include the actual location as well
        const slice = this.GetMultipleRandomValues(words.filter(x => x.Location !== this.CurrentLocation), 29);
        const locations = slice.map(x => x.Location);
        locations.push(this.CurrentLocation);
        return locations;
    }

    private GetMultipleRandomValues<T>(array: Array<T>, count: number) {
        var result = new Array(count),
            length = array.length,
            taken = new Array(length);
        if (count > length)
            throw new RangeError("GetMultipleRandomValues: attempting to take more elements than size!");
        while (count--) {
            var x = Math.floor(Math.random() * length);
            result[count] = array[x in taken ? taken[x] : x];
            taken[x] = --length in taken ? taken[length] : length;
        }
        return result;
    }

    public CreateVote = (initiator: Player, target: Player) => {
        this.CurrentVote = {
            initiator: this.CreateStatePlayer(initiator), 
            target: this.CreateStatePlayer(target),
            votes: new Array<{player: StatePlayer, agreement: boolean}>(),
            voteCompleted: false
        }

        this.VoteParticipants = new Array<Player>();
        initiator.hasCreatedVote = true;
    }

    public HandleNewVote = (voter: Player, agreement: boolean) => {
        this.CurrentVote?.votes.push({player: this.CreateStatePlayer(voter), agreement: agreement});
        this.VoteParticipants?.push(voter);
        voter.hasVoted = true;
    }

    public EndVote = () => { // TODO: So far, there is only one way for the game to end, and that is if someone is voted out
        if (this.CurrentVote?.votes.find(x => x.agreement === false) === undefined) { // Someone was voted out
            if (!this.Spy || !this.CurrentLocation) return;
            this.CancelGame();
            this.EndGame = { 
                revealedSpy: this.CreateStatePlayer(this.Spy), 
                location: this.CurrentLocation,
                guessedLocation: undefined,
                newScores: new Array() 
            };

            if (this.CurrentVote?.target.discriminator === this.Spy.discriminator)  // Spy was voted out
                this.DefaultNonSpyVictory(true);
            else // Someone other than the spy was voted out
                this.DefaultSpyVictory(); 
            return;
        }
        this.ClearVote();
    }

    private DefaultSpyVictory () {
        if (!this.EndGame || !this.Spy) return;
        this.Spy.score += 4;
        this.EndGame.newScores.push({ player: this.CreateStatePlayer(this.Spy), addedScore: 4 });
    }

    private DefaultNonSpyVictory (vote: boolean) {
        if (!this.EndGame || !this.Spy) return;
        this.Players.forEach(player => {
            const statePlayer = this.CreateStatePlayer(player);
            if (player.isSpy) { 
                this.EndGame?.newScores.push({ player: statePlayer, addedScore: 0 }); // Add the zero for display purposes
                return; 
            } 
            if (vote && player.discriminator === this.CurrentVote?.initiator.discriminator) { 
                player.score += 2;
                this.EndGame?.newScores.push({ player: statePlayer, addedScore: 2 }); // Initiator is awarded two points for starting the vote
                return;
            }
            player.score += 1;
            this.EndGame?.newScores.push({ player: statePlayer, addedScore: 1 }); // Regular players that aren't the spy get one point
        });
    }

    public ClearVote = () => {
        this.CurrentVote = undefined;
        this.VoteParticipants = undefined;
        this.Players.forEach((player) => player.hasVoted = false);
    }

    public CalculateVotes = (): boolean => { // Determines if voting is over 
        if (!this.CurrentVote || !this.VoteParticipants) return false;
        for (const player of Array.from(this.Players.values())) {
            if (this.CurrentVote.initiator.discriminator === player.discriminator) continue;
            if (this.CurrentVote.target.discriminator === player.discriminator) continue;
            if (!this.VoteParticipants.includes(player)) return false; // Someone hasn't voted
        }

        this.CurrentVote.voteCompleted = true;
        return true;
    }

    public HandleLocationGuess = (guess: string) => {
        if (!this.Spy || !this.CurrentLocation) return;
        this.CancelGame();
        this.EndGame = {
            revealedSpy: this.CreateStatePlayer(this.Spy),
            location: this.CurrentLocation,
            guessedLocation: guess,
            newScores: new Array()
        }
        if (guess === this.CurrentLocation) { // Spy guessed correctly
            this.DefaultSpyVictory();
        } else {
            this.DefaultNonSpyVictory(false); // No vote here; there is no initiator to award 2 points to
        }
    } 

    public EndGameViaTimer = () => {
        if (!this.Spy || !this.CurrentLocation) return;
        const revealedSpy = this.CreateStatePlayer(this.Spy);
        this.EndGame = { 
            revealedSpy: revealedSpy,
            location: this.CurrentLocation,
            guessedLocation: undefined,
            newScores: new Array() 
        };
        this.Spy.score += 2;
        this.EndGame.newScores.push({ player: revealedSpy, addedScore: 2 }); // Spy gets two points if time runs out
    }

    public Reset = () => {
        this.Started = false;
        this.IsStarting = false;
        this.Spy = undefined;
        this.GuessSelection = undefined;
        this.CurrentLocation = undefined;
        this.CurrentVote = undefined;
        this.VoteParticipants = undefined;
        this.EndGame = undefined;
        this.StartTimerID = undefined;
        this.GameTimerID = undefined;
        this.Players.forEach((player) => { // Reset everything except their score
            player.isSpy = false;
            player.role = undefined;
            player.hasCreatedVote = false;
            player.hasVoted = false; // Reset the vote of each player
        });
    }

    public StoreStartID = (timeout: NodeJS.Timeout) => this.StartTimerID = timeout; 
    public CancelStart = () => { if(this.StartTimerID !== undefined) clearTimeout(this.StartTimerID); this.IsStarting = false; }
    public CancelGame = () => { if(this.GameTimerID !== undefined) clearTimeout(this.GameTimerID); }
    public StartGame = (timeout: NodeJS.Timeout) => { 
        this.IsStarting = false; 
        this.StartTimerID = undefined; 
        this.Started = true; 
        this.GameTimerID = timeout;
    }

    private CreateSafeNickname (nickname: string): string { // Creates a nickname that is unique for the room
        let finalNick = nickname; // If two players named 'ready player' join, one will be 'ready player' and the other will be 'ready player 1'
        if (this.GetPlayerByName(nickname) != undefined) {
            let itr = 1;
            while (this.GetPlayerByName(finalNick) != undefined) {
                finalNick = `${nickname} ${itr}`;
                itr++;
            }
        }
        return finalNick;
    }

    private GenerateDiscriminator (): number {
        const max = MAX_ROOM_MEMBER_COUNT;
        const discriminators = Array.from(this.Discriminators.keys());
        for (let i = 1; i <= max; i++) {
            if (!discriminators.includes(i)) return i;
        }
        throw('Cannot generate a discriminator for an invalid player.');
    }

    private CreateStatePlayer (player: Player): StatePlayer {
        return {
            nickname: player.nickname,
            discriminator: player.discriminator,
            isHost: player.isHost,
            score: player.score
        }
    }
}

function GenerateDefaultWordPack (): WordList[] {
    return [
        {
            Name: 'Default',
            Custom: false,
            Data: packager.DEFAULT,
            Enabled: true
        }
    ];
}

export interface Player {
    playerID: string;
    discriminator: number; // Discriminator is a public ID used to distinguish players; relying solely on unique nicknames is not great
    nickname: string;
    isHost: boolean;
    score: number;
    isSpy: boolean | undefined; 
    role: string | undefined; 
    // Location and role info is not important here except for state
    // If players could cache data from state, having a role here would be irrelevant
    hasCreatedVote: boolean | undefined;
    hasVoted: boolean;
}