import React from "react";
import "./components.css";

export interface InputProps {
  name: string;
  failCondition: boolean;
  disableCondition: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;

  focusOnStart: boolean;
}

export default function Input({
  name,
  failCondition,
  disableCondition,
  onChange,
  type = "text",
  focusOnStart,
}: InputProps) {
  return (
    <input
      autoFocus={focusOnStart}
      autoComplete="off"
      type={type}
      data-lpignore="true"
      className="input"
      name={name}
      style={failCondition ? { borderColor: "var(--error-red)" } : {}}
      disabled={disableCondition}
      onChange={onChange}
    ></input>
  );
}
