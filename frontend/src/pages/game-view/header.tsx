import {
    makeStyles,
    createStyles,
    Theme, 
    Button
} from '@material-ui/core';

import copy from 'clipboard-copy';

import ArrowBack from '@material-ui/icons/ArrowBack';
import Link from '@material-ui/icons/Link';

import { About } from '../../components/about';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        header: {
            textAlign: 'center',
            position: 'relative',
            width: '100%',
            height: '60px'
        },
        buttonWrapper: {
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
        },
        aboutWrapper: {
            position: 'absolute',
            margin: '0.5rem',
            top: 0,
            right: 0
        }
    })
)

export interface HeaderProps {
    roomID: string;
    hasPlayed: boolean;
    leave: () => void;
}

export default function Header ({ roomID, hasPlayed, leave }: HeaderProps) {
    const classes = useStyles();
    return (
        <header className={classes.header}>
            <div className={classes.buttonWrapper}>
                <Button
                type='button'
                onClick={leave}
                startIcon={<ArrowBack />}
                className={classes.button}>
                    Leave
                </Button>
                <Button
                type='button'
                onClick={() => copy(`${window.location.origin}/room?id=${roomID}`)}
                startIcon={<Link />} 
                className={classes.button}>
                    Copy Room URL
                </Button>
            </div>
            <div className={classes.aboutWrapper}>
                <About hasPlayed={hasPlayed} />
            </div>
        </header>
    )
}