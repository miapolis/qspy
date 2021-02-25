import React from 'react';
import './components.css';

export interface FormButtonProps {
    onClick: () => void;
    text: string;
    showDots: boolean;
}

interface FormButtonState {
    timestamp: number;
}

export default class FormButton extends React.Component<FormButtonProps, FormButtonState> {
    constructor(props:FormButtonProps) {
        super(props);
        this.state = ({timestamp: 0});
    }

    reset = () => { this.state = ({timestamp: 1 - this.state.timestamp}); }
    render () {
        return (
            <div>
                <button style={this.props.showDots ? {pointerEvents: 'none'}:{}} key={this.state.timestamp} 
                disabled={this.props.showDots} className='formButton' onClick={this.props.onClick}>{this.props.showDots ? '' : this.props.text}</button>
                { this.props.showDots ? (
                <div className='dotAreaDirect'>
                    <div className='dotsDirect'></div>
                </div> ) : null}
            </div>
        );
    }
}