import React from "react";
import {
  makeStyles,
  createStyles,
  Theme,
  Button,
  IconButton,
} from "@material-ui/core";

import AddIcon from "@material-ui/icons/Add";
import RemoveIcon from "@material-ui/icons/Remove";

import { Pack } from "../../protocol";
import { PrimaryActionButton, Sender } from "./main";

import PackSelection from "./pack-selection";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    controlGroup: {
      position: "absolute",
      left: "50%",
      display: "flex",
      justifyContent: "center",
      flexFlow: "column",
      transform: "translateX(-50%)",
      bottom: "90px",
    },
  })
);

export interface PreStartProps {
  starting: boolean;
  playerCount: number;
  timerLength: number;
  packs: readonly Pack[];
  isHost: boolean;
  send: Sender;
}

function PreStart({
  starting,
  playerCount,
  timerLength,
  packs,
  isHost,
  send,
}: PreStartProps) {
  const classes = useStyles();

  const [packDialogOpen, setPackDialogOpen] = React.useState(false);
  const changeTime = (add: boolean) => {
    if (add && timerLength + 30 <= 600) {
      send.changeTime(timerLength + 30);
      return;
    } else if (!add && timerLength - 30 >= 300)
      send.changeTime(timerLength - 30);
  };

  return (
    <div>
      <h2 className="statusHeader">
        {!starting
          ? playerCount < 3
            ? "Waiting for more players..."
            : "Waiting for host to start game..."
          : "Game is starting..."}
      </h2>
      <h3 className="statusSubHeader">
        {playerCount < 3
          ? `At least ${3 - playerCount} more player${
              playerCount == 1 ? "s" : ""
            } ${playerCount == 1 ? "are" : "is"} needed to start a game.`
          : `${playerCount} players`}
      </h3>
      {isHost ? (
        <div>
          <div className={classes.controlGroup}>
            <Button
              style={{ marginBottom: "10px" }}
              disabled={starting}
              onClick={() => setPackDialogOpen(true)}
            >
              Packs
            </Button>
            <PackSelection
              isOpen={packDialogOpen}
              packs={packs}
              send={send}
              onClose={() => setPackDialogOpen(false)}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexFlow: "row",
              }}
            >
              <IconButton
                onClick={() => changeTime(false)}
                size="small"
                style={{ color: "#bbbbbb" }}
              >
                <RemoveIcon />
              </IconButton>
              <div
                style={{
                  fontSize: "25px",
                  color: "#cccccc",
                  paddingLeft: "10px",
                  paddingRight: "10px",
                }}
              >
                {`${Math.floor(timerLength / 60)}:${
                  timerLength % 60 < 10 ? "0" : ""
                }${timerLength % 60}`}
              </div>
              <IconButton
                onClick={() => changeTime(true)}
                size="small"
                style={{ color: "#bbbbbb" }}
              >
                <AddIcon />
              </IconButton>
            </div>
          </div>
          <PrimaryActionButton
            onClick={() => send.startGame()}
            disabled={playerCount < 3 || starting}
            variant="outlined"
            size="medium"
            color="primary"
          >
            START GAME
          </PrimaryActionButton>
        </div>
      ) : null}
    </div>
  );
}

export default React.memo(PreStart);
