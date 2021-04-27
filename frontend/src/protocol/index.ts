// ARCHITECTURE
// Client sends simple packets with few parameters
// Server sends the entire state of game
import myzod, { Infer } from 'myzod';
import { DeepReadonly } from 'ts-essentials';

// Messages from client to server
export type ClientPacket = Infer<typeof ClientPacket>;
const ClientPacket = myzod.union([
    myzod.object({
        method: myzod.literal('changeNickname'),
        params: myzod.object({ nickname: myzod.string() })
    }),
    myzod.object({
        method: myzod.literal('kickPlayer'),
        params: myzod.object({ discriminator: myzod.number() })
    }),
    myzod.object({
        method: myzod.literal('changeTime'),
        params: myzod.object({ time: myzod.number() })
    }),
    myzod.object({
        method: myzod.literal('updatePack'),
        params: myzod.object({ id: myzod.number(), enabled: myzod.boolean() })
    }),
    myzod.object({
        method: myzod.literal('startGame'),
        params: myzod.object({})
    }),
    myzod.object({
        method: myzod.literal('createVote'),
        params: myzod.object({ target: myzod.number() })
    }),
    myzod.object({
        method: myzod.literal('vote'),
        params: myzod.object({ agreement: myzod.boolean() })
    }),
    myzod.object({
        method: myzod.literal('guessLocation'),
        params: myzod.object({ guess: myzod.string() })
    }),
    myzod.object({
        method: myzod.literal('playAgain'),
        params: myzod.object({})
    })
]);

// Messages from server to client 
export const WSC_Reason_Kicked = 'KICK';
export const WSC_Reason_Room_Close = 'ROOM_CLOSED';

// STATE DEFINITIONS 
export type RoomResponse = DeepReadonly<Infer<typeof RoomResponse>>;
export const RoomResponse = myzod.object({ // Add more with passwords?
    roomID: myzod.string().optional().nullable(),
    error: myzod.string().optional().nullable(),
    mistake: myzod.number().optional().nullable() // Used for highlighting the input field where the user set invalid data
});

export type JoinResponse = DeepReadonly<Infer<typeof JoinResponse>>;
export const JoinResponse = myzod.object({
    error: myzod.string().optional().nullable(),
    mistake: myzod.number().optional().nullable()
})

export type StatePlayer = DeepReadonly<Infer<typeof StatePlayer>>;
export const StatePlayer = myzod.object({
    nickname: myzod.string(),
    discriminator: myzod.number(),
    score: myzod.number(),
    isHost: myzod.boolean()
});

export type LocalPlayer = DeepReadonly<Infer<typeof LocalPlayer>>;
export const LocalPlayer = myzod.object({
    playerID: myzod.string(),
    discriminator: myzod.number(),
    nickname: myzod.string(),
    isHost: myzod.boolean(),
    score: myzod.number(),
    isSpy: myzod.boolean().optional(),
    role: myzod.string().optional(),
    hasCreatedVote: myzod.boolean().optional(),
    hasVoted: myzod.boolean()
});

export type VoteState = DeepReadonly<Infer<typeof VoteState>>;
export const VoteState = myzod.object({
    initiator: StatePlayer,
    target: StatePlayer,
    votes: myzod.array(myzod.object({player: StatePlayer, agreement: myzod.boolean()})),
    voteCompleted: myzod.boolean()
});

export type EndGameState = DeepReadonly<Infer<typeof EndGameState>>;
export const EndGameState = myzod.object({ 
    revealedSpy: StatePlayer.optional(),
    location: myzod.string(),
    spySchool: myzod.boolean(),
    guessedLocation: myzod.string().optional(),
    newScores: myzod.array(myzod.object({player: StatePlayer, addedScore: myzod.number()}))
});

export type Pack = DeepReadonly<Infer<typeof Pack>>;
export const Pack = myzod.object({
    id: myzod.number(),
    name: myzod.string(),
    description: myzod.string(),
    locationCount: myzod.number(),
    roleCount: myzod.number(),
    enabled: myzod.boolean()
})

export type RoomState = DeepReadonly<Infer<typeof RoomState>>;
export const RoomState = myzod.object({
    players: myzod.array(StatePlayer),
    started: myzod.boolean(),
    isStarting: myzod.boolean(),
    timerLength: myzod.number(),
    packs: myzod.array(Pack),
    guessSelection: myzod.array(myzod.string()).optional(),
    currentLocation: myzod.string().optional(),
    currentSuggestion: myzod.string().optional(),
    currentVote: VoteState.optional(),
    endGame: EndGameState.optional()
});

export type State = DeepReadonly<Infer<typeof State>>;
export const State = myzod.object({
    me: LocalPlayer,
    roomState: RoomState
});

// PACKETS
export type ServerPacket = DeepReadonly<Infer<typeof ServerPacket>>;
export const ServerPacket = myzod.union([
    myzod.object({
        method: myzod.literal('state'),
        params: State
    }),
]);