import React from 'react';
import './components.css';

export default function Dots ({verticalOffset = 0}) {
    return (
        <div className='dotAreaCenter' style={{transform: `translateY(-${verticalOffset}px)`}}>
            <div className='dotsCenter'></div>
        </div>
    );
}