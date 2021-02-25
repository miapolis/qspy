import React from 'react';
import { GameView, Sender } from './game-view';

export const UserContext = React.createContext<Boolean>(true);

const send: Sender = new Proxy({}, { get: () => {} }) as Sender;

const props = {
    roomName: '__STATIC__',
    send: send,
    me: {
        playerID: '0',
        discriminator: 1,
        nickname: 'Username',
        isHost: true,
        score: 0,
        isSpy: true,
        hasVoted: false
    },
    state: {
        players: [
            {
                nickname: 'Username',
                discriminator: 1,
                score: 0,
                isHost: true
            },
            {
                nickname: 'Bob',
                discriminator: 2,
                score: 0,
                isHost: false
            },
            {
                nickname: 'Joe',
                discriminator: 3,
                score: 0,
                isHost: false
            },
            {
                nickname: 'Player',
                discriminator: 4,
                score: 0,
                isHost: false
            },
            {
                nickname: 'Gamer',
                discriminator: 5,
                score: 0,
                isHost: false
            },
            {
                nickname: 'Disney Princess',
                discriminator: 6,
                score: 0,
                isHost: false
            }
        ],
        started: true,
        isStarting: false,
        timerLength: 300,
        guessSelection: [
            'Beach',
            'Restaurant',
            'Casino',
            'Bank',
            'Ocean Liner',
            'Police Station'
        ],
        endGame: {
            revealedSpy: {
                nickname: 'Username',
                discriminator: 1,
                score: 0,
                isHost: true
            },
            location: 'Beach',
            guessedLocation: 'Beach',
            newScores: [
                {
                    player: {
                        nickname: 'Username',
                        discriminator: 1,
                        score: 0,
                        isHost: true
                    },
                    addedScore: 4
                } 
            ]
        }
    }
}

export const StaticView = () => {
    return (
        <UserContext.Provider value={true}>
            <GameView roomName={props.roomName} send={props.send} me={props.me} state={props.state} leave={() => {}} hasUserPlayed={true}/>
        </UserContext.Provider>
    );
}
