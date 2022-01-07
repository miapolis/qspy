import React from "react";
import {
  makeStyles,
  createStyles,
  Theme,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Button,
  Card,
  Divider,
  DialogActions,
} from "@material-ui/core";

import { Sender } from "./main";
import { Pack } from "../../protocol";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    packGrid: {
      display: "grid",
      gap: "15px",
      marginBottom: "10px",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    },
  })
);

interface PackSelectionProps {
  isOpen: boolean;
  packs: readonly Pack[];
  send: Sender;
  onClose: () => void;
}

function PackSelection({ isOpen, packs, send, onClose }: PackSelectionProps) {
  const classes = useStyles();
  return (
    <Dialog open={isOpen} fullWidth={true} onClose={onClose} maxWidth="md">
      <DialogTitle>Packs</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`${packs
            .filter((x) => x.enabled)
            .reduce((a, b) => a + b.locationCount, 0)} locations,
                    ${packs
                      .filter((x) => x.enabled)
                      .reduce(
                        (a, b) => a + b.roleCount,
                        0
                      )} roles in selected packs`}
        </DialogContentText>
        <div className={classes.packGrid}>
          {packs.map((pack) => {
            return (
              <Card
                style={{
                  backgroundColor: "#444444",
                  minHeight: "100px",
                  padding: "15px",
                }}
              >
                <Button
                  variant={pack.enabled ? "contained" : "outlined"}
                  color={pack.enabled ? "primary" : undefined}
                  style={{ marginBottom: "10px" }}
                  onClick={() => send.updatePack(pack.id, !pack.enabled)}
                >
                  {pack.name}
                </Button>
                <p>{pack.description}</p>
              </Card>
            );
          })}
        </div>
        <DialogContentText>More packs coming soon!</DialogContentText>
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={() => onClose()}>CLOSE</Button>
      </DialogActions>
    </Dialog>
  );
}

export default React.memo(PackSelection);
