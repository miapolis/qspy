import React from "react";
import { makeStyles, createStyles, Theme } from "@material-ui/core";

import ReplayIcon from "@material-ui/icons/Replay";

import { EndGameState } from "../../protocol";
import { PrimaryActionButton, Sender } from "./main";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    preSpy: { color: "#cccccc", fontWeight: "normal", display: "inline-block" },
    spy: {
      color: "white",
      fontSize: "40px",
      display: "inline-block",
      paddingLeft: "10px",
    },
    preGuess: {
      color: "#cccccc",
      fontWeight: "normal",
      display: "inline-block",
      paddingTop: "10px",
    },
    guess: {
      color: "white",
      fontWeight: "normal",
      display: "inline-block",
      paddingLeft: "5px",
    },
    preLocation: {
      color: "#cccccc",
      fontWeight: "normal",
      display: "inline-block",
    },
    location: {
      color: "white",
      fontWeight: "normal",
      display: "inline-block",
      paddingLeft: "5px",
      paddingTop: "10px",
    },
    scoreGroup: {
      width: "100%",
      display: "flex",
      height: "350px",
      flexFlow: "column",
      overflowY: "auto",
      alignItems: "center",
    },
    scoreElement: { display: "table", marginTop: "7px" },
    scoreElementNickname: {
      display: "table-cell",
      color: "#dddddd",
      fontSize: "20px",
    },
    scoreElementPoints: {
      display: "table-cell",
      color: "#ffa726",
      fontSize: "20px",
      paddingLeft: "10px",
    },
  })
);

interface EndGameProps {
  endGame: EndGameState;
  isHost: boolean;
  send: Sender;
}

function EndGame({ endGame, isHost, send }: EndGameProps) {
  const classes = useStyles();

  const sortedScores = Array.from(endGame.newScores).sort(
    (a, b) => b.addedScore - a.addedScore
  );
  return (
    <div>
      <div style={{ marginBottom: "20px", marginTop: "40px" }}>
        <h1 className={classes.preSpy}>Spy:</h1>
        <h1 className={classes.spy}>
          {endGame.revealedSpy ? endGame.revealedSpy.nickname : "Everyone"}
        </h1>
        <br />
        {endGame.guessedLocation ? (
          <div>
            <h2 className={classes.preGuess}>Guess:</h2>
            <h2 className={classes.guess}>{endGame.guessedLocation}</h2>
            <br />
          </div>
        ) : null}
        <h3 className={classes.preLocation}>Location:</h3>
        <h3 className={classes.location}>{endGame.location}</h3>
      </div>
      <div className={classes.scoreGroup}>
        {sortedScores.map((score) => {
          return (
            <div className={classes.scoreElement}>
              <div className={classes.scoreElementNickname}>
                {score.player.nickname}
              </div>
              <div className={classes.scoreElementPoints}>
                {`+${score.addedScore}`}
              </div>
            </div>
          );
        })}
      </div>
      {isHost ? (
        <PrimaryActionButton
          startIcon={<ReplayIcon />}
          onClick={() => send.playAgain()}
          variant="outlined"
          color="primary"
        >
          Play Again
        </PrimaryActionButton>
      ) : null}
    </div>
  );
}

export default React.memo(EndGame);
