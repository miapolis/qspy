import React from "react";

export interface TimerProps {
  duration: number;
}

interface TimerState {
  timeLeft: number;
}

export default class Timer extends React.Component<TimerProps, TimerState> {
  constructor(props: TimerProps) {
    super(props);
  }

  componentWillMount() {
    this.state = { timeLeft: this.props.duration };
    setInterval(
      () =>
        this.setState({
          timeLeft: this.state.timeLeft > 0 ? this.state.timeLeft - 1 : 0,
        }),
      1000
    );
  }

  getMinutes(): string {
    return Math.floor(this.state.timeLeft / 60).toString();
  }
  getSeconds(): string {
    return (this.state.timeLeft % 60).toString();
  }
  getSecondsFormated(): string {
    const seconds = this.getSeconds();
    return seconds.length > 1 ? seconds : `0${seconds}`;
  }

  render() {
    return (
      <h1
        style={
          this.state.timeLeft > 10 ? { color: "#dddddd" } : { color: "#ffa726" }
        }
      >
        {this.state.timeLeft >= 60
          ? `${this.getMinutes()}:${this.getSecondsFormated()}`
          : `${this.getSeconds()}s`}
      </h1>
    );
  }
}
