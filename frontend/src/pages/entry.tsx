import React from 'react';
import EntryForm, { FormData } from '../components/entry-form';
import './pages.css';

import { version } from '../metadata.json';
import { checkOutdated, assertIsDefined } from '../common';
import { RoomResponse } from '../protocol';

export interface EntryProps {
    onLogin: (roomId:string, name:string, playerID:string) => void;
    error: string | undefined; // There might be an error when we come back to this page
}

interface EntryState {
    errorMessage: string | undefined;
}

export default class Entry extends React.Component<EntryProps, EntryState> {
    private form = React.createRef<EntryForm>();

    constructor(props: EntryProps) {
        super(props);
        this.state = ({
            errorMessage: props.error ?? undefined
        })
    }
    
    render() {
        return (
        <div className='appMount'>
            <div className='formContainer'>
                <h2 className='title'>QSpy</h2>
                <EntryForm ref={this.form} onSubmit={this.submit}/>
                <div className='entryError'>{this.state.errorMessage}</div>
            </div>
        </div> 
        );
    }

    submit = (data:FormData):void => {
        setTimeout(async () => {
            let response: Response | undefined;
            let roomResponse: RoomResponse | undefined;
            const headers = { 'X-QSPY-VERSION': version, "Content-Type": "application/json" };

            try {
                const reqBody = JSON.stringify({ nickname: data.name, roomName: data.roomName, create: data.create });
                response = await fetch('/api/room', { method: 'POST', body: reqBody, headers });
                if (checkOutdated(response)) { return; }
                const body = await response.json();
                roomResponse = RoomResponse.parse(body);
            } catch { }

            assertIsDefined(response);

            if ((response == undefined || response == null) || !response.ok || !roomResponse || !roomResponse.playerID) { // So many things could go wrong...
                this.setState({errorMessage: roomResponse?.error || 'An unknown error occurred.'});
                if (roomResponse?.mistake != null && roomResponse.mistake != undefined) this.form.current?.forceErrorProperty(Number(roomResponse.mistake));
                this.form.current?.reset();
                return;
            }

            this.setState({errorMessage: undefined});
            this.props.onLogin(data.roomName.trim(), data.name, roomResponse.playerID);
        }, 1000);
    }
}

