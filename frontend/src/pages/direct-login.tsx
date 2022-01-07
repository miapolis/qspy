import React from "react";
import "./pages.css";

import Input from "../components/input";
import FormButton from "../components/form-button";
import { checkOutdated, assertIsDefined } from "../common";
import { JoinResponse } from "../protocol";
import metadata from "../metadata.json";

export interface DirectLoginProps {
  roomID: string;
  callbackFunc: (nickname: string, playerID: string) => void;
}

export default function DirectLogin({
  roomID,
  callbackFunc,
}: DirectLoginProps) {
  const submitButton = React.createRef<FormButton>();

  const [nameFailed, setNameFailed] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [showDots, setShowDots] = React.useState<boolean>(false);
  const [name, setName] = React.useState<string>();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    const value = target.value;
    setName(value);
  };

  const handleSubmit = () => {
    if (name === "" || name === undefined) {
      setNameFailed(true);
      return;
    } else setNameFailed(false);
    setShowDots(true);

    setTimeout(async () => {
      let response: Response | undefined;
      let joinResponse: JoinResponse | undefined;
      const headers = {
        "X-QSPY-VERSION": metadata.version,
        "Content-Type": "application/json",
      };

      try {
        const reqBody = JSON.stringify({
          nickname: name,
          roomID: roomID,
          create: false,
        });
        response = await fetch("/api/join", {
          method: "POST",
          body: reqBody,
          headers,
        });
        if (checkOutdated(response)) {
          return;
        }
        const body = await response.json();
        joinResponse = JoinResponse.parse(body);
      } catch {}

      assertIsDefined(response);

      if (!response || !response.ok || !joinResponse) {
        setError(joinResponse?.error || "An unknown error occurred.");
        if (joinResponse?.mistake) setNameFailed(true);

        setShowDots(false);
        submitButton.current?.reset();
        return;
      }

      setError(undefined);
      callbackFunc(name, roomID);
    }, 1000);
  };

  return (
    <div className="appMount">
      <div className="directLoginContainer">
        <div className="directForm">
          <h2 className="title">QSpy</h2>
          <div className="directLoginText">Enter a nickname to continue</div>
          <Input
            focusOnStart={true}
            name="name"
            failCondition={nameFailed}
            disableCondition={false}
            onChange={handleChange}
          />
          <FormButton
            ref={submitButton}
            onClick={handleSubmit}
            text={"JOIN ROOM"}
            showDots={showDots}
          />
        </div>
        <div className="entryError">{error}</div>
      </div>
    </div>
  );
}
