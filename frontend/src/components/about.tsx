import React from 'react';

import { Button, IconButton, Modal, makeStyles, Theme, createStyles, createMuiTheme } from '@material-ui/core';
import orange from '@material-ui/core/colors/orange';
import blue from '@material-ui/core/colors/blue';
import Fade from '@material-ui/core/Fade';
import Backdrop from '@material-ui/core/Backdrop';
import Info from '@material-ui/icons/Info';
import Close from '@material-ui/icons/Close';

const theme = createMuiTheme({
    palette: {
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

const useModalStyles = makeStyles((_theme: Theme) => {
    return createStyles({
        modal: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        paper: {
            backgroundColor: theme.palette.background.paper,
            border: 'none',
            borderRadius: '5px',
            boxShadow: theme.shadows[5],
            padding: theme.spacing(2, 4, 3),
            maxWidth: '700px',
            maxHeight: 'calc(100vh - 120px)',
            margin: '40px!important',
            overflowY: 'auto',
            outline: 'none'
        },
        h2: {
            marginBottom: '20px',
            color: '#eeeeee'
        },
        p: {
            color: '#dddddd',
            fontSize: '15px',
        }
    })
});

const useButtonStyles = makeStyles((_theme: Theme) => 
    createStyles({
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

export const HowToPlay = (props:{style?: React.CSSProperties, hasPlayed: boolean}) => {
    const headerClasses = useButtonStyles();
    const classes = useModalStyles();
    const [open, setOpen] = React.useState(!props.hasPlayed);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false); 

    return (
        <div style={props.style}>
            <Button startIcon={<Info />} onClick={handleOpen} className={headerClasses.button}>About</Button>
            <Modal aria-labelledby="modal-title" aria-describedby="modal-description" className={classes.modal} open={open} onClose={handleClose} closeAfterTransition BackdropComponent={Backdrop} BackdropProps={{timeout: 500}}>
                <Fade in={open}>
                    <div className={classes.paper}>
                        <IconButton style={{float: 'right', color: '#cccccc'}} size='small' edge='end' color='inherit' onClick={handleClose} aria-label="close">
                            <Close />
                        </IconButton>
                        <h2 className={classes.h2} id='modal-title'>How to play</h2>
                        <p className={classes.p} id="modal-description">
                            <b>QSpy</b> is a social deduction game in which players work together to determine
                            who the spy is between them.  
                        </p>
                        <br />
                        <p className={classes.p} id="modal-description">
                            <b>Gameplay:</b> When the game starts, everyone receives the same location and a unique role,
                            except for one person who is the spy. All regular players want to find out who the spy
                            is and vote them out before the spy guesses the location correctly and wins.
                        </p>
                        <br />
                        <p className={classes.p} id="modal-description">
                        <b>Discussion:</b> Once everyone knows what they are, the discussion begins. During the discussion, players
                        take turns asking each other questions. Players try to ask questions which will help them find the
                        spy, while the spy wants to guess the location and stay undetected. For example, a player could ask
                        another player, “What kind of colors do you see at this place?” or “Are children allowed at this place?” 
                        Once a player has answered, they must ask a question to another player. Players can answer
                        however they want, but they might be suspected of being the spy if they always answer too vaguely.
                        Note that it is important to be discrete in your questions and answers during the discussion because
                        the spy can easily win if everything is too obvious.
                        </p>
                        <br />
                        <p className={classes.p} id="modal-description">
                        <b>Voting and Rounds:</b> The round ends when the discussion timer is up. All players at any time can put a player
                        up for vote. The rest of the players then vote for if they agree or disagree with the vote. Votes need
                        to be <b>unanimous</b> to successfully vote out a suspected player and end the round before the timer. Each
                        player can only put up another player for vote once per round. The spy can also guess the location at
                        any time, and this will end the round early as well. 
                        </p>
                        <br />
                        <p className={classes.p} id="modal-description">
                        The round ends when the discussion timer is over, when players successfully vote out another player, or when the spy
                        makes a guess about the location. Non-spy players can only win if they vote out the spy or if the spy guesses the
                        location incorrectly, but the spy can win if the timer runs out or if they guess the location correctly. 
                        </p>
                        <br />
                        <p className={classes.p} id="modal-description">
                            Spy Victory:<br />
                            • The spy gets <b>2 points</b> if the round ends and no one is voted out<br />
                            • The spy gets <b>4 points</b> if someone that isn't the spy is voted out<br />
                            • The spy gets <b>4 points</b> if they guess the location correctly, otherwise it is a non-spy victory<br /><br />
                            Non-Spy Victory:<br />
                            • Everyone except the spy gets <b>1 point</b><br />
                            • The player that initiated the successful vote for the spy gets <b>2 points</b>
                        </p>
                    </div>
                </Fade>
            </Modal>
        </div>
    );
}