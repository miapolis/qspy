import React from 'react';
import {
    createStyles,
    makeStyles,
    Theme,
    Button
} from '@material-ui/core';

import LocationOnIcon from '@material-ui/icons/LocationOn';
import AccountCircle from '@material-ui/icons/AccountCircle';

import Vote from './vote';
import VoteDialog from './vote-dialog';
import Location from './location';
import { Card } from '../../components/card';

import { RoomState, LocalPlayer } from '../../protocol';
import { Sender } from './main';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        centralArea: {
            width: '100%',
            height: 'calc(100% - 100px)',
            display: 'flex',
            flex: '1 1 auto',
            flexFlow: 'column'
        },
        mainArea: {
            width: '100%',
            height: 0,
            display: 'flex',
            flex: '1 1 auto',
            justifyContent: 'center',
            alignItems: 'center'
        },
        lowerSector: {
            width: '100%',
            height: '100px',
            bottom: '0',
            display: 'flex',
            flex: 'none',
            alignItems: 'center',
            justifyContent: 'center'
        },
        buttonGroup: {
            height: '36px',
            display: 'flex',
            width: '100%',
            columnGap: '10px',
            justifyContent: 'center'
        }
    })
)

export interface CentralAreaProps {
    state: RoomState;
    me: LocalPlayer;
    send: Sender;
}

export default function CentralArea ({ state, me, send }: CentralAreaProps) {
    const classes = useStyles();

    const [cardFlipped, setCardFlipped] = React.useState(false);
    const [voteValue, setVoteValue] = React.useState<string>('');
    const [voteDialogOpen, setVoteDialogOpen] = React.useState(false);
    const [guessLocationDialogOpen, setGuessLocationDialogOpen] = React.useState(false);

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
        <div className={classes.centralArea}>
            <div className={classes.mainArea}>
            {
                !state.currentVote ?
                <Card spy={me.isSpy || false} location={state.currentLocation} role={me.role} onOpen={() => setCardFlipped(true)}/>
                : <Vote currentVote={state.currentVote} me={me} send={send} />
            }
            </div>
            <div className={classes.lowerSector}>
            {
                cardFlipped ? 
                    <div className={classes.buttonGroup}>
                    {
                        me.isSpy ?
                        <Button
                        onClick={() => setGuessLocationDialogOpen(true)}
                        style={{boxSizing: 'border-box'}}
                        variant='outlined'
                        color='primary'
                        disabled={state.currentVote != undefined}
                        startIcon={<LocationOnIcon />}
                        >
                            GUESS LOCATION
                        </Button>
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
                    </div> 
                : null
            }
            {
                state.guessSelection ? <Location 
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
        </div>
    )
}