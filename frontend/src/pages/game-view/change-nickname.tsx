import React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Input
} from '@material-ui/core';

import { Sender } from './main';

interface ChangeNicknameProps {
    isOpen: boolean;
    currentNickname: string;
    send: Sender;
    onClose: () => void;
}

export default function ChangeNickname ({ isOpen, currentNickname, send, onClose }: ChangeNicknameProps) {
    const [value, setValue] = React.useState(currentNickname);
    const [error, setError] = React.useState(false);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    }

    const handleClose = (submit: boolean) => {
        if (submit) {
            if (value.length < 0 || value.length > 16) { setError(true); return; }
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
}