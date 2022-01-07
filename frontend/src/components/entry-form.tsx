import React from "react";
import "./components.css";
import Input from "./input";

export interface FormData {
  name: string;
  roomName: string;
  roomPass: string;
  create: boolean;
}

export interface FormProps {
  onSubmit: (data: FormData) => void;
}

export interface FormState {
  name: string;
  roomName: string;
  roomPass: string;
  showDots: number;
  timestamp: number;
  nameFailed: boolean;
  roomNameFailed: boolean;
  roomPassFailed: boolean;
}

export default class EntryForm extends React.Component<FormProps, FormState> {
  constructor(props: FormProps) {
    super(props);
    this.state = {
      name: "",
      roomName: "",
      roomPass: "",
      showDots: -1,
      timestamp: 0,
      nameFailed: false,
      roomNameFailed: false,
      roomPassFailed: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    const value = target
      ? target.type === "checkbox"
        ? target.checked
        : target.value
      : -1; // -1 is needed to include number value for state
    const name = target.name;
    this.setState({
      [name]: value,
    } as Pick<FormState, keyof FormState>);
  };

  handleSubmit = (
    _: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    button: number
  ): void => {
    if (this.state.name === "") {
      this.setState({ nameFailed: true });
    } else this.setState({ nameFailed: false });
    if (this.state.roomName === "") {
      this.setState({ roomNameFailed: true });
    } else this.setState({ roomNameFailed: false });
    if (this.state.roomPass === "") {
      this.setState({ roomPassFailed: true });
    } else this.setState({ roomPassFailed: false });

    if (
      this.state.name === "" ||
      this.state.roomName === "" ||
      this.state.roomPass === ""
    ) {
      return;
    }

    this.props.onSubmit({
      name: this.state.name,
      roomName: this.state.roomName,
      roomPass: this.state.roomPass,
      create: button === 1 ? true : false,
    });

    this.setState({ showDots: button });
  };

  reset = () => {
    this.setState({ timestamp: 1 - this.state.timestamp, showDots: -1 }); // Flipping the timestamp will re-render all locked elements and revert them to their saved state
  };

  forceErrorProperty = (value: number) => {
    if (value === 0) this.setState({ nameFailed: true });
    if (value === 1) this.setState({ roomNameFailed: true });
    if (value === 2) this.setState({ roomPassFailed: true });
    if (value === 3)
      this.setState({ roomNameFailed: true, roomPassFailed: true });
  };

  render() {
    return (
      <div className="entryForm">
        <label className="label">NICKNAME</label>
        <Input
          focusOnStart={true}
          name="name"
          failCondition={this.state.nameFailed}
          disableCondition={this.state.showDots !== -1}
          onChange={this.handleChange}
        />
        <label className="label">ROOM NAME</label>
        <Input
          focusOnStart={false}
          name="roomName"
          failCondition={this.state.roomNameFailed}
          disableCondition={this.state.showDots !== -1}
          onChange={this.handleChange}
        />
        <label className="label">PASSWORD</label>
        <Input
          focusOnStart={false}
          name="roomPass"
          type="password"
          failCondition={this.state.roomPassFailed}
          disableCondition={this.state.showDots !== -1}
          onChange={this.handleChange}
        />
        <div className="buttonContainer">
          <div
            className="buttonHalf buttonHalf-left"
            style={this.state.showDots !== -1 ? { pointerEvents: "none" } : {}}
          >
            <button
              className="submitButton left"
              disabled={this.state.showDots == 0}
              key={this.state.timestamp}
              onClick={(e) => this.handleSubmit(e, 0)}
            >
              {this.state.showDots !== 0 ? "JOIN A GAME" : ""}
            </button>
            {this.state && this.state.showDots === 0 ? (
              <div className="dotArea">
                <div className="dots"></div>
              </div>
            ) : null}
          </div>
          <div
            className="buttonHalf buttonHalf-right"
            style={this.state.showDots !== -1 ? { pointerEvents: "none" } : {}}
          >
            <button
              className="submitButton right"
              disabled={this.state.showDots == 1}
              key={this.state.timestamp}
              onClick={(e) => this.handleSubmit(e, 1)}
            >
              {this.state.showDots !== 1 ? "CREATE A GAME" : ""}
            </button>
            {this.state && this.state.showDots === 1 ? (
              <div className="dotArea">
                <div className="dots"></div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}
