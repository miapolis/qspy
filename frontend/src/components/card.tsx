import React from 'react';
import './components.css';
import logo from '../assets/logo256.png';
import spyHat from '../assets/spy_hat.png';
import topSecret from '../assets/top_secret.png';

export interface CardProps {
    spy: boolean;
    location: string | undefined;
    role: string | undefined;
    onOpen: () => void;
}

interface CardState {
    flipped: boolean;
}

export default class Card extends React.Component<CardProps, CardState> {
    constructor(props:CardProps) {
        super(props);
        this.state = { flipped: false };
        this.flip = this.flip.bind(this);
    }

    flip = () => { 
        this.setState({ flipped: !this.state.flipped });
        setTimeout(() => this.props.onOpen(), 400);
    }

    render() {
        return (
            <div className={`card-container ${this.props.spy ? 'spy' : ''} ${this.state.flipped ? ' flipped' : ''}`} onClick={this.flip}>
                <div className='innerCard'>
                    <this.Front />
                    <this.Back />
                </div> 
            </div>
        );
    }

    Front = () => {
        return (
            <div className='card-front'>
                <img className='unselectable' draggable={false} src={logo} width='70px' height='70px'/>
                <p>Click to flip</p>
            </div>
        );
    }

    Back = () => {
        return (
            <div className='card-back'>
                { 
                    this.props.spy ?
                    <div>
                        <img className='unselectable' draggable={false} src={spyHat} width='20%' style={{marginTop: '120px'}} />
                        <h1 style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        fontSize: '60px', color: 'white'
                        }}>SPY</h1>
                        <p style={{
                            width: '70%', position: 'absolute', color: '#eeeeee', bottom: '130px',
                            left: '50%', transform: 'translateX(-50%)',
                        }}>You are the spy. Try to blend in with everyone else.</p>
                    </div>
                    :
                    <div style={{height: '100%', display: 'flex', flexFlow: 'column', justifyContent: 'center', alignItems: 'center'}}>
                        <img className='unselectable' draggable={false} src={topSecret} width='50%' style={{position: 'absolute', top: '40px'}}/>
                        <p style={{color: '#dddddd', marginTop: '100px'}}>Location:</p>
                        <p style={{color: 'white', fontSize: '30px'}}>{this.props.location}
                        <a target='_blank' href={`https://www.google.com/search?q=what+is+${this.props.location}`} style={
                            {marginLeft: '5px', color: '#aaaaaa', fontSize: '20px'}}>?</a>
                        </p>
                        {/* User might upload locations without roles, so this should be supported */}
                        {this.props.role ? <p style={{color: '#dddddd', marginTop: '20px'}}>Role:</p> : null} 
                        <p style={{color: 'white', fontSize: '25px'}}>{this.props.role}</p>
                    </div>
                }
            </div>
        );
    }
}