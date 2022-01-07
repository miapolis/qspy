import React from "react";
import "./components.css";
import crown from "../assets/crown.png";
import kickMember from "../assets/kick_member.png";

import { UserContext } from "../pages/game";

export interface PlayerElementProps {
  name: string;
  discriminator: number;
  isHost: boolean;
  score: number;
  rank: number | undefined;
  onKick: (discriminator: number) => void;
}

export default function PlayerElement({
  name,
  discriminator,
  isHost,
  score,
  rank,
  onKick,
}: PlayerElementProps) {
  const host = React.useContext(UserContext);
  const [hovered, setHovered] = React.useState<boolean>(false);
  const nameText = isHost ? "nameText host" : "nameText";
  return (
    <div
      className="playerElement"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        {rank !== undefined ? (
          <div className={nameText}>
            <b>{`${rank}.`}</b> {name}
          </div>
        ) : (
          <div className={nameText}>{name}</div>
        )}
        {isHost ? <img src={crown}></img> : null}
      </div>
      {score !== 0 ? (
        <div className="scoreText">
          <b>{score}</b> {score === 1 ? "point" : "points"}
        </div>
      ) : null}
      {hovered && host && !isHost ? (
        <img
          className="kick unselectable"
          onClick={() => onKick(discriminator)}
          draggable={false}
          src={kickMember}
        ></img>
      ) : null}
    </div>
  );
}
