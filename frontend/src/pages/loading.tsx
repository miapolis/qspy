import React from 'react';
import Dots from '../components/dots';
import './pages.css';

import querystring from 'querystring';
import { checkOutdated } from '../common';
import { version } from '../metadata.json';

interface AppProps {
    callbackFunc: (roomName: string | undefined, roomFound: boolean | undefined) => void;
}

export default function Loading (props: AppProps) { // Loading only active on application entry
    React.useEffect(() => {
        setTimeout(async () => {
            if (window.location.pathname.startsWith('/room/')) { // For people that were sent a direct '/room/roomname' url
                const headers = { 'X-QSPY-VERSION': version };
                const id = window.location.href.substring(window.location.href.lastIndexOf('/') + 1);
                const query = querystring.stringify({roomID: id});

                const response = await fetch('/api/exists?' + query, { headers });
                if (checkOutdated(response)) { return; }
                await response.text();

                props.callbackFunc(id, response.ok);
            } else props.callbackFunc(undefined, undefined); // Data isn't set prior to form submission
        }, 1000);
    }, []);

    return (
        <div className='appMount'>
            <Dots />
        </div>
    );
}