import React from 'react';
import Dots from '../components/dots';
import './pages.css';

import querystring from 'querystring';
import { checkOutdated } from '../common';
import { version } from '../metadata.json';

interface AppProps {
    callbackFunc: (roomID: string | null, roomFound: boolean | undefined) => void;
}

export default function Loading (props: AppProps) { // Loading only active on application entry
    React.useEffect(() => {
        setTimeout(async () => {
            if (window.location.pathname.endsWith('/room')) { // For people that were sent a direct '/room?roomID=[...]' url
                const headers = { 'X-QSPY-VERSION': version };
                const id = new URLSearchParams(window.location.search).get('id');
                const query = querystring.stringify({roomID: id});

                const response = await fetch('/api/exists?' + query, { headers });
                if (checkOutdated(response)) { return; }
                await response.text();

                props.callbackFunc(id, response.ok);
            } else props.callbackFunc(null, undefined); // Data isn't set prior to form submission
        }, 1000);
    }, []);

    return (
        <div className='appMount'>
            <Dots />
        </div>
    );
}