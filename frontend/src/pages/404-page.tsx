import React from 'react';
import './pages.css';

export interface NotFoundProps {
    message:string;
}

export default function NotFoundPage (props:NotFoundProps) {
    return (
        <div className='appMount nfr'>
            <h1>404</h1>
            <div>{props.message}</div>
        </div>
    );
}