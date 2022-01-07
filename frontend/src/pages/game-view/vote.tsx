import React from "react";
import { makeStyles, createStyles, Theme, Button } from "@material-ui/core";

import CheckIcon from "@material-ui/icons/Check";
import ClearIcon from "@material-ui/icons/Clear";

import { LocalPlayer, VoteState } from "../../protocol";
import { Sender } from "./main";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    vote: {
      display: "flex",
      flexFlow: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "100%",
      top: "0",
    },
    creationHeader: {
      fontSize: "auto",
      fontWeight: "normal",
      color: "#eeeeee",
    },
    voteState: {
      color: "#aaaaaa",
      marginTop: "10px",
    },
    buttonGroup: {
      marginTop: "15px",
    },
    votersGroup: {
      display: "flex",
      alignItems: "start",
      justifyContent: "start",
      flexFlow: "column",
      position: "relative",
      marginTop: "25px",
      height: "250px",
      width: "300px",
      overflowY: "auto",
    },
    nickname: {
      display: "table-cell",
      fontSize: "20px",
      color: "#cccccc",
      maxWidth: "250px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      paddingBottom: "7px",
    },
    agreement: {
      display: "table-cell",
      color: "#ffa726",
      verticalAlign: "middle",
      paddingLeft: "7px",
    },
  })
);

interface VoteProps {
  currentVote: VoteState;
  me: LocalPlayer;
  send: Sender;
}

function Vote({ currentVote, me, send }: VoteProps) {
  const classes = useStyles();
  return (
    <div className={classes.vote}>
      <h1 className={classes.creationHeader}>
        <b>{currentVote.initiator.nickname}</b> wants to vote{" "}
        <b>{currentVote.target.nickname}</b>
      </h1>
      <div className={classes.voteState}>
        {currentVote.voteCompleted
          ? currentVote.votes.find((x) => x.agreement === false)
            ? "Votes need to be unanimous in order to vote someone out!"
            : `${currentVote.target.nickname} has been voted out.`
          : currentVote.initiator.discriminator === me.discriminator ||
            me.hasVoted
          ? "Waiting for players to vote..."
          : currentVote.target.discriminator === me.discriminator
          ? "You are not permitted to vote."
          : "Do you agree with this decision?"}
      </div>
      {currentVote.initiator.discriminator !== me.discriminator &&
      currentVote.target.discriminator !== me.discriminator &&
      !me.hasVoted ? (
        <div className={classes.buttonGroup}>
          <Button onClick={() => send.vote(true)}>Yes</Button>
          <Button onClick={() => send.vote(false)}>No</Button>
        </div>
      ) : null}
      <div className={classes.votersGroup}>
        {currentVote.votes.map((vote) => {
          return (
            <div style={{ display: "table" }}>
              <div className={classes.nickname}>{vote.player.nickname}</div>
              <div className={classes.agreement}>
                {vote.agreement ? <CheckIcon /> : <ClearIcon />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default React.memo(Vote);
