import React from 'react';
import {
    Button,
    Dialog, 
    DialogContent,
    DialogTitle,
    DialogActions
} from '@material-ui/core';

import { Sender } from './main';

interface LocationProps {
    isOpen: boolean;
    locations: readonly string[];
    send: Sender;
    onClose: () => void;
}

function Location ({isOpen, locations, send, onClose}: LocationProps) {
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
}

export default React.memo(Location);