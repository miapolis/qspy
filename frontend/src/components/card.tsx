import React from 'react';
import './components.css';
import logo from '../assets/logo256.png';
import spyHat from '../assets/spy_hat.png';
import topSecret from '../assets/top_secret.png';
import { couldStartTrivia } from 'typescript';

export interface CardProps {
    spy: boolean;
    location: string | undefined;
    role: string | undefined;
    onOpen: () => void;
}

export function Card ({spy, location, role, onOpen}: CardProps) {
    const [flipped, setFlipped] = React.useState(false); 
    const parentRef = React.useRef<HTMLDivElement>(null);
    const childRef = React.useRef<HTMLDivElement>(null);

    const flip = () => { 
        setFlipped(!flipped);
        setTimeout(() => onOpen(), 400);
    }

    React.useEffect(() => handleResize(), []);
    window.addEventListener('resize', _ => handleResize());

    const handleResize = () => {
        if (parentRef.current && childRef.current) {
            if (parentRef.current.offsetHeight < 420) {
                childRef.current.style.transform = `scale(${parentRef.current.offsetHeight / childRef.current.offsetHeight})`;
            }
        }
    }

    return (
        <div ref={parentRef} style={{width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div ref={childRef} className={`card-container ${spy ? 'spy' : ''} ${flipped ? ' flipped' : ''}`} onClick={flip}>
                <div className='innerCard'>
                    <Front />
                    <Back spy={spy} location={location} role={role}/>
                </div> 
            </div>
        </div>
    );
}

const Front = () => {
    return (
        <div className='card-front'>
            <img className='unselectable' draggable={false} src={logo} width='70rem' height='70rem'/>
            <p>Click to flip</p>
        </div>
    );
}

interface BackProps {
    spy: boolean;
    location: string | undefined;
    role: string | undefined;
}

const Back = ({spy, location, role}:BackProps) => {
    return (
        <div className='card-back'>
            { 
                spy ?
                <div>
                    <img className='unselectable' draggable={false} src={spyHat} width='20%' style={{marginTop: '8rem'}} />
                    <h1 style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    fontSize: '4rem', color: 'white'
                    }}>SPY</h1>
                    <p style={{
                        width: '70%', position: 'absolute', color: '#eeeeee', bottom: '8.66rem',
                        left: '50%', transform: 'translateX(-50%)',
                    }}>You are the spy. Try to blend in with everyone else.</p>
                </div>
                :
                <div style={{height: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'center', alignItems: 'center'}}>
                    <img className='unselectable' draggable={false} src={topSecret} width='50%' style={{position: 'absolute', top: '2.66rem'}}/>
                    <p style={{color: '#dddddd', marginTop: '6.66rem'}}>Location:</p>
                    <p style={{color: 'white', fontSize: '2rem'}}>{location}
                    <a target='_blank' href={`https://www.google.com/search?q=what+is+${location}`} style={
                        {marginLeft: '0.33rem', color: '#aaaaaa', fontSize: '1.33rem'}}>?</a>
                    </p>
                    {/* User might upload locations without roles, so this should be supported */}
                    {role ? <p style={{color: '#dddddd', marginTop: '1.33rem'}}>Role:</p> : null} 
                    <p style={{color: 'white', fontSize: '1.66rem'}}>{role}</p>
                </div>
            }
        </div>
    );
}