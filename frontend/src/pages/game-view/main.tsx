import React from 'react';
import '../pages.css';

import { Button } from '@material-ui/core';
import { createMuiTheme, ThemeProvider, withStyles } from '@material-ui/core/styles';
import orange from '@material-ui/core/colors/orange';
import blue from '@material-ui/core/colors/blue';

import CentralArea from './central-area';
import PreStart from './pre-start';
import Header from './header';
import ChangeNickname from './change-nickname';
import EndGame from './end-game';
import PlayerElement from '../../components/player-element';
import Dots from '../../components/dots';
import Timer from '../../components/timer';

import { DeepReadonly } from 'ts-essentials';
import { LocalPlayer, RoomState } from '../../protocol';

export interface Sender {
    changeNickname: (nickname: string) => void;
    kickPlayer: (discriminator: number) => void;
    changeTime: (time: number) => void;
    updatePack: (id: number, enabled: boolean) => void;
    startGame: () => void;
    createVote: (target: number) => void;
    vote: (agreement: boolean) => void;
    guessLocation: (guess: string) => void;
    playAgain: () => void;
}

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: { main: orange[400] },
        secondary: { main: blue[50] },
        background: {
            paper: '#2e2e2e'
        },
        action: {
            disabled: '#aaaaaa'
        }
    }
});

export const PrimaryActionButton = withStyles({ root: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '24px'} })(Button);

export interface GameViewProps {
    roomID: string;
    send: Sender;
    me: LocalPlayer;
    state: RoomState;
    leave: () => void;
    hasPlayed: boolean;
}

export const GameView = ({me, roomID, send, state, leave, hasPlayed }: DeepReadonly<GameViewProps>) => {
    const playerCount = state.players.length;
    const [nicknameDialogOpen, setNicknameDialogOpen] = React.useState(false);

    const sortedPlayers = Array.from(state.players).sort((a, b) => b.score - a.score);

    return (
        <ThemeProvider theme={theme}>
            <div className='appMount'>
                <Header roomID={roomID} hasPlayed={hasPlayed} leave={leave} />
                <div className='mainArea'>
                    { 
                        !state.endGame && state.started ?
                        <div className='topSector'>
                            <div className='gameTimer'>
                                { state.timerLength && state.started && !state.endGame ? <Timer duration={state.timerLength}/> : null }
                            </div>
                        </div> 
                        : null
                    }
                    {
                        state.isStarting ? 
                        <Dots verticalOffset={60}/> 
                        : null
                    }
                    { 
                        !state.started ? 
                        <PreStart 
                        starting={state.isStarting}
                        playerCount={playerCount} 
                        timerLength={state.timerLength} 
                        packs={state.packs}
                        isHost={me.isHost}
                        send={send} />
                        : state.endGame ?
                        <EndGame endGame={state.endGame} isHost={me.isHost} send={send} />
                        :
                        <CentralArea state={state} me={me} send={send} />
                    }
                </div>
                <div className='playerArea'>
                    <h2>Players</h2>
                    {sortedPlayers.map((player, _) => {
                        return (
                            <PlayerElement 
                            key={player.discriminator.toString()} 
                            discriminator={player.discriminator} 
                            name={player.nickname} 
                            isHost={player.isHost}
                            score={player.score}
                            rank={player.score == 0 ? undefined : sortedPlayers.indexOf(player) + 1}
                            onKick={(discriminator: number) => send.kickPlayer(discriminator)}/>
                        );
                    })}
                    <Button
                    className='changeNicknameButton'
                    onClick={() => setNicknameDialogOpen(true)}
                    variant='outlined'>
                        Change Nickname
                    </Button>
                    <div style={{height: '5px'}}></div>
                    <ChangeNickname
                    isOpen={nicknameDialogOpen}
                    currentNickname={me.nickname}
                    send={send}
                    onClose={() => {
                        setNicknameDialogOpen(false);
                    }}/>
                </div>
            </div>
        </ThemeProvider>
    );  
}