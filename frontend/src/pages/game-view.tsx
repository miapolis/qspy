import React from 'react';
import './pages.css';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, IconButton, Input, RadioGroup } from '@material-ui/core';
import { createMuiTheme, createStyles, makeStyles, Theme, ThemeProvider, withStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import orange from '@material-ui/core/colors/orange';
import blue from '@material-ui/core/colors/blue';
import Link from '@material-ui/icons/Link';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import ReplayIcon from '@material-ui/icons/Replay';
import ArrowBack from '@material-ui/icons/ArrowBack';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import AccountCircle from '@material-ui/icons/AccountCircle';

import Card from '../components/card';
import { HowToPlay } from '../components/about';
import PlayerElement from '../components/player-element';
import Dots from '../components/dots';
import Timer from '../components/timer';

import copy from 'clipboard-copy';
import { DeepReadonly } from 'ts-essentials';
import { EndGameState, LocalPlayer, RoomState, StatePlayer, VoteState } from '../protocol';

export interface Sender {
    changeNickname: (nickname: string) => void;
    kickPlayer: (discriminator: number) => void;
    changeTime: (time: number) => void;
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

const PrimaryActionButton = withStyles({ root: { position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '24px'} })(Button);

const useHeaderButtonStyles = makeStyles((_theme: Theme) => 
    createStyles({
        wrapper: {
            position: 'absolute',
            top: 0,
            left: 0,
            margin: '0.5rem'
        },
        button: {
            marginRight: '0.5rem',
            color: '#ffffff',
            paddingLeft: '10px',
            paddingRight: '10px',
            '&:hover': {
                backgroundColor: '#333333'
            }
        }
    })
);

const CornerButtons = React.memo(function CornerButtons({roomID, leave}:{roomID: string, leave: () => void}) {
    const classes = useHeaderButtonStyles();
    return (
        <>
            <div className={classes.wrapper}>
                <Button type='button' onClick={leave} startIcon={<ArrowBack />} className={classes.button}>Leave</Button>
                <Button type='button' onClick={() => copy(window.location.href)} startIcon={<Link />} className={classes.button}>Copy Room URL</Button>
            </div>
        </>
    );
});

interface VoteDialogProps {
    isOpen: boolean;
    me: LocalPlayer;
    value: string;
    players: readonly StatePlayer[];
    onClose: (value: string, final?: boolean) => void;
}

const VoteDialog = React.memo(function VoteDialog({isOpen, me, value: valueProp, players, onClose}:VoteDialogProps) {
    const [value, setValue] = React.useState<string>(valueProp);
    const radioGroupRef = React.useRef<HTMLElement>(null);
    const handleEntering = () => { if (radioGroupRef.current != null) radioGroupRef.current.focus(); }
    const handleCancel = () => onClose(value);
    const handleOk = () => { onClose(value, true); }
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => { setValue((event.target as HTMLInputElement).value); }
    React.useEffect(() => { if (!isOpen) setValue(valueProp); }, [valueProp, isOpen]);

    return (
        <Dialog 
        disableBackdropClick
        disableEscapeKeyDown
        fullWidth={true}
        maxWidth='sm' // h
        onEntering={handleEntering}
        open={isOpen}
        aria-labelledby='confirmation-dialog-title'>
            <DialogTitle id="confirmation-dialog-title">{me.isSpy ? 'Who are you framing?' : 'Who is the Spy?'}</DialogTitle>
            <DialogContent dividers>
                <DialogContentText>Note: this action can only be done once per round.</DialogContentText>
                <RadioGroup
                ref={radioGroupRef}
                aria-label="playervote"
                name="playervote"
                value={value}
                onChange={handleChange}>   
                    {players.map(player => {
                        return (player.discriminator !== me.discriminator ? <FormControlLabel 
                        value={player.discriminator.toString()} key={player.discriminator.toString()} 
                        control={<Radio color='primary' />}
                        label={player.nickname} /> : null)
                    })}
                </RadioGroup>     
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color='primary'>Cancel</Button>
                <Button onClick={handleOk} color='primary'>Create Vote</Button>
            </DialogActions>
        </Dialog>
    );
});

interface LocationDialogProps {
    isOpen: boolean;
    locations: readonly string[];
    send: Sender;
    onClose: () => void;
}

const LocationDialog = React.memo(function LocationDialog({isOpen, locations, send, onClose}:LocationDialogProps) {
    const [selectedLocation, setSelectedLocation] = React.useState<string | undefined>(undefined);

    const handleClose = (final: boolean) => {
        if (final && selectedLocation) send.guessLocation(selectedLocation);
        onClose();
    }

    return (
        <Dialog
        open={isOpen}
        disableBackdropClick
        fullWidth={true}
        maxWidth='sm'
        >
            <DialogTitle>Guess Location</DialogTitle>
            <DialogContent dividers>
                { locations.map(location => {
                    return (
                        <Button
                        style={{margin: '5px'}}
                        onClick={() => setSelectedLocation(location)}
                        variant={selectedLocation === location ? 'contained' : 'outlined'}
                        color={selectedLocation === location ? 'primary' : undefined}
                        >{location}</Button>
                    );
                })
                }
            </DialogContent>
            <DialogActions>
                <Button color='primary' onClick={() => handleClose(false)}>Cancel</Button>
                <Button color='primary' disabled={selectedLocation == undefined} onClick={() => handleClose(true)}>Guess Location</Button>
            </DialogActions>
        </Dialog>
    );
});

interface ChangeNicknameDialogProps {
    isOpen: boolean;
    currentNickname: string;
    send: Sender;
    onClose: () => void;
}

const ChangeNicknameDialog = React.memo(function ChangeNicknameDialog({isOpen, currentNickname, send, onClose}:ChangeNicknameDialogProps) {
    const [value, setValue] = React.useState(currentNickname);
    const [error, setError] = React.useState(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    }

    const handleClose = (submit: boolean) => {
        if (submit) {
            if (value.length < 0 || value.length > 16) {
                setError(true);
                return;
            }
            send.changeNickname(value);
        }
        onClose();
        setError(false);
    }

    return (
        <Dialog
        disableBackdropClick
        fullWidth={true}
        maxWidth='xs'
        open={isOpen}
        >
            <DialogTitle>Change Nickname</DialogTitle>
            <DialogContent>
                <Input style={{width: '100%'}} autoFocus={true} value={value} onChange={handleChange} error={error}/>
            </DialogContent>
            <DialogActions>
                <Button color='primary' onClick={() => handleClose(false)}>Cancel</Button>
                <Button color='primary' onClick={() => handleClose(true)}>Ok</Button>
            </DialogActions>
        </Dialog>
    );
});

interface PreStartHeaderProps {
    starting: boolean;
    playerCount: number;
    timerLength: number;
    isHost: boolean;
    send: Sender;
}

const PreStartHeaders = React.memo(function PreStartHeaders({starting, playerCount, timerLength, isHost, send}:PreStartHeaderProps) {
    const changeTime = (add: boolean) => {
        if (add) { 
            if (timerLength + 30 <= 600) send.changeTime(timerLength + 30); 
            return; 
        }
        else {
            if (timerLength - 30 >= 300) send.changeTime(timerLength - 30);
        }
    }

    return (
        <div>
            <h2 className='statusHeader'>
            {
                !starting ? 
                (playerCount < 3 ? 
                'Waiting for more players...' : 
                'Waiting for host to start game...') :
                'Game is starting...'
            }
            </h2>
            <h3 className='statusSubHeader'>
                {playerCount < 3 ? 
                `At least ${3 - playerCount} more player${playerCount == 1 ? 's' : ''} ${playerCount == 1 ? 'are' : 'is'} needed to start a game.` : 
                `${playerCount} players`}
            </h3>
            {isHost ? 
                <div>
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        transform: 'translateX(-50%)',
                        bottom: '90px',
                    }}>
                        <IconButton onClick={() => changeTime(false)} size='small' style={{color: '#bbbbbb'}}>
                            <RemoveIcon />
                        </IconButton>
                        <div style={{fontSize: '25px', color: '#cccccc', paddingLeft: '10px', paddingRight: '10px'}}>
                            {`${Math.floor(timerLength / 60)}:${timerLength % 60 < 10 ? '0' : ''}${timerLength % 60}`}
                        </div>
                        <IconButton onClick={() => changeTime(true)} size='small' style={{color: '#bbbbbb'}}>
                            <AddIcon />
                        </IconButton>
                    </div>
                    <PrimaryActionButton 
                    onClick={() => send.startGame()} 
                    disabled={playerCount < 3 || starting} 
                    variant='outlined' size='medium' color='primary'>
                        START GAME
                    </PrimaryActionButton> 
                </div>
            : null}
        </div>
    );
});

interface VoteMenuProps {
    currentVote: VoteState;
    me: LocalPlayer;
    send: Sender;
}

const VoteMenu = React.memo(function ({currentVote, me, send}: VoteMenuProps) {
    return (
        <div style={{display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center'}}>
            <h1 style={{fontSize: 'auto', fontWeight: 'normal', color: '#eeeeee' }}>
                <b>{currentVote.initiator.nickname}</b> wants to vote <b>{currentVote.target.nickname}</b>
            </h1>
            <div style={{color: '#aaaaaa', marginTop: '10px'}}>
                {
                currentVote.voteCompleted ?
                (currentVote.votes.find(x => x.agreement === false) ? 
                'Votes need to be unanimous in order to vote someone out!' :
                `${currentVote.target.nickname} has been voted out.`) :
                currentVote.initiator.discriminator === me.discriminator || me.hasVoted ? 
                    'Waiting for players to vote...' :
                    currentVote.target.discriminator === me.discriminator ?
                    'You are not permitted to vote.' :
                    'Do you agree with this decision?'
                }
            </div>
            {
                currentVote.initiator.discriminator !== me.discriminator &&
                currentVote.target.discriminator !== me.discriminator &&
                !me.hasVoted ?
                <div style={{marginTop: '15px'}}>
                    <Button onClick={() => send.vote(true)}>Yes</Button>
                    <Button onClick={() => send.vote(false)}>No</Button>
                </div> : null
            }
            <div style={{
                display: 'flex', 
                alignItems: 'start', 
                justifyContent: 'start', 
                flexFlow: 'column',
                position: 'relative', 
                marginTop: '25px', 
                height: '250px', 
                width: '300px', 
                overflowY: 'auto'
                }}>
                {currentVote.votes.map((vote) => {
                    return (
                        <div style={{display: 'table'}}>
                            <div style={{
                                display: 'table-cell', 
                                fontSize: '20px', 
                                color: '#cccccc', 
                                maxWidth: '250px', 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                paddingBottom: '7px'}}> 
                                {vote.player.nickname}
                            </div>
                            <div style={{display: 'table-cell', color: '#ffa726', verticalAlign: 'middle', paddingLeft: '7px'}}>
                                {vote.agreement ? <CheckIcon /> : <ClearIcon />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div> 
    );
});

interface EndGameMenuProps {
    endGame: EndGameState;
    isHost: boolean;
    send: Sender;
}

const EndGameMenu = React.memo(function ({endGame, isHost, send}:EndGameMenuProps) {
    const sortedScores = Array.from(endGame.newScores).sort((a, b) => b.addedScore - a.addedScore);

    return (
        <div>
            <div style={{marginBottom: '20px', marginTop: '40px'}}>
                <h1 style={{color: '#cccccc', fontWeight: 'normal', display: 'inline-block'}}>Spy:</h1>
                <h1 style={{color: 'white', fontSize: '40px', display: 'inline-block', paddingLeft: '10px'}}>{endGame.revealedSpy.nickname}</h1><br/>
                {
                    endGame.guessedLocation ? <div>
                        <h2 style={{color: '#cccccc', fontWeight: 'normal', display: 'inline-block', paddingTop: '10px'}}>Guess:</h2>
                        <h2 style={{color: 'white', fontWeight: 'normal', display: 'inline-block', paddingLeft: '5px'}}>{endGame.guessedLocation}</h2><br/>
                    </div> : null
                }
                <h3 style={{color: '#cccccc', fontWeight: 'normal', display: 'inline-block'}}>Location:</h3>
                <h3 style={{color: 'white', fontWeight: 'normal', display: 'inline-block', paddingLeft: '5px', paddingTop: '10px'}}>{endGame.location}</h3>
            </div>
            <div style={{width: '100%', display: 'flex', height: '350px', flexFlow: 'column', overflowY: 'auto', alignItems: 'center'}}>
                {sortedScores.map((score) => {
                        return (
                            <div style={{display: 'table', marginTop: '7px'}}>
                                <div style={{display: 'table-cell', color: '#dddddd', fontSize: '20px'}}>{score.player.nickname}</div>
                                <div style={{display: 'table-cell', color: '#ffa726', fontSize: '20px', paddingLeft: '10px'}}>
                                    {`+${score.addedScore}`}
                                </div>
                            </div>
                        );
                })}
            </div>
            {
                isHost ? 
                <PrimaryActionButton startIcon={<ReplayIcon />} onClick={() => send.playAgain()} variant='outlined' color='primary'>
                    Play Again
                </PrimaryActionButton>
                : null
            } 
        </div>
    );
});

export interface GameViewProps {
    roomName: string;
    send: Sender;
    me: LocalPlayer;
    state: RoomState;
    leave: () => void;
    hasUserPlayed: boolean;
}

export const GameView = ({me, roomName, send, state, leave, hasUserPlayed}: DeepReadonly<GameViewProps>) => {
    const playerCount = state.players.length;
    const [cardFlipped, setCardFlipped] = React.useState(false);
    const [voteValue, setVoteValue] = React.useState<string>('');
    const [voteDialogOpen, setVoteDialogOpen] = React.useState(false);
    const [guessLocationDialogOpen, setGuessLocationDialogOpen] = React.useState(false);
    const [nicknameDialogOpen, setNicknameDialogOpen] = React.useState(false);

    const sortedPlayers = Array.from(state.players).sort((a, b) => b.score - a.score);

    React.useEffect(() => {
        if (!state.started) 
            setCardFlipped(false); // Reset the reveal of the card
    }, [state.started]);

    const handleVoteDialogClose = (newValue: string, final?: boolean) => {
        setVoteDialogOpen(false);
        setVoteValue(newValue);
        if (final) send.createVote(parseInt(newValue));
    }

    return (
        <ThemeProvider theme={theme}>
            <div className='appMount'>
                <div className='topHeader'>
                    <CornerButtons roomID={roomName} leave={leave} />
                    <HowToPlay hasPlayed={hasUserPlayed} style={{position: 'absolute', margin: '0.5rem', top: 0, right: 0}} />
                </div>
                <div className='gameTimer'>
                    { state.timerLength && state.started && !state.endGame ? <Timer duration={state.timerLength}/> : null }
                </div>
                <div className='mainArea'>
                    {state.isStarting ? <Dots verticalOffset={60}/> : null}
                    { 
                        !state.started ? <PreStartHeaders starting={state.isStarting} playerCount={playerCount} timerLength={state.timerLength} isHost={me.isHost} send={send} />
                        : state.endGame ? <EndGameMenu endGame={state.endGame} isHost={me.isHost} send={send} />
                        :
                        (
                            <div>
                                {
                                    !state.currentVote ? <Card spy={me.isSpy || false} location={state.currentLocation} role={me.role} onOpen={() => setCardFlipped(true)}/> 
                                    : <VoteMenu currentVote={state.currentVote} me={me} send={send} />  
                                }
                                {
                                    cardFlipped ? <div style={{
                                        position: 'absolute',
                                        bottom: '15px',
                                        left: '50%',
                                        height: '36px',
                                        display: 'flex',
                                        width: '100%',
                                        columnGap: '10px',
                                        justifyContent: 'center',
                                        transform: 'translateX(-50%)'}}>
                                        { me.isSpy ?
                                        <Button
                                        onClick={() => setGuessLocationDialogOpen(true)}
                                        style={{boxSizing: 'border-box'}}
                                        variant='outlined'
                                        color='primary'
                                        disabled={state.currentVote != undefined}
                                        startIcon={<LocationOnIcon />}
                                            >
                                            GUESS LOCATION</Button>
                                        : null
                                        }
                                        <Button 
                                        disabled={me.hasCreatedVote || state.currentVote != undefined} 
                                        style={{boxSizing: 'border-box'}} 
                                        onClick={() => setVoteDialogOpen(true)} 
                                        variant='outlined' 
                                        color={me.isSpy ? 'default' : 'primary'} 
                                        startIcon={<AccountCircle />}>
                                            CREATE VOTE
                                        </Button>
                                    </div> : null
                                }
                                {
                                    state.guessSelection ? <LocationDialog 
                                    isOpen={guessLocationDialogOpen}
                                    locations={state.guessSelection}
                                    send={send}
                                    onClose={() => setGuessLocationDialogOpen(false)}
                                    /> : null 
                                }
                                <VoteDialog 
                                me={me} 
                                players={state.players} 
                                value={voteValue} 
                                isOpen={state.currentVote ? false : voteDialogOpen} 
                                onClose={handleVoteDialogClose}/>
                            </div>
                        )
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
                    <Button className='changeNicknameButton' onClick={() => setNicknameDialogOpen(true)} variant='outlined'>Change Nickname</Button>
                    <div style={{height: '5px'}}></div>
                    <ChangeNicknameDialog isOpen={nicknameDialogOpen} currentNickname={me.nickname} send={send} onClose={() => {
                        setNicknameDialogOpen(false);
                    }}/>
                </div>
            </div>
        </ThemeProvider>
    );  
}