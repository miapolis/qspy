import express, { NextFunction } from "express";
var router = express.Router();

import { Version } from "../../version/version";
import {
  JoinRequest,
  RoomRequest,
  ValidJoinRequest,
  ValidRoomRequest,
} from "../../protocol";
import { server } from "../../main";
import { MAX_ROOM_MEMBER_COUNT } from "../server";
import * as metrics from "../metrics";

export const checkVersion = (req: any, res: any, next: NextFunction) => {
  const clientVersion = req.header("X-QSPY-VERSION");
  if (clientVersion == undefined || clientVersion != Version()) {
    res.status(418).send("Version does not match API version.");
    return;
  }

  next();
};

router.use("/api/exists", checkVersion);
router.use("/api/room", checkVersion);

router.get("/api/exists", async function (req, res) {
  if (!req.query.roomID) {
    res.sendStatus(400);
    return;
  }
  const roomID = req.query.roomID.toString();
  var room = await server.FindRoomByID(roomID);
  if (room == undefined) res.sendStatus(404);
  else res.sendStatus(200);
});

router.post("/api/room", async function (req, res) {
  const body = req.body;
  const data = new RoomRequest(
    body.nickname,
    body.roomName,
    body.roomPass,
    body.create
  );
  if (!data.Sanitize()) return; // Possibility that the next checks will cause the server to crash if invalid data is served

  // Validate their nickname and other parameters (best one-liner ever)
  try {
    const valid = ValidRoomRequest(data);
    if (!valid[1]) {
      res
        .status(400)
        .send(JSON.stringify({ error: valid[0], mistake: valid[2] }));
      return;
    }
  } catch {
    return;
  }

  if (data.create) {
    var room = await server.CreateRoom(data.roomName, data.roomPass);
    if (room[1] != undefined || !room[0]) {
      // Something has failed
      const err = room[1];
      var obj = { playerID: undefined, error: err };
      switch (err) {
        case "Too many rooms.":
          res.status(503).send(JSON.stringify(obj));
          break;
        case "Room already exists.":
          res.status(400).send(JSON.stringify(obj));
          break;
        case "Unknown error.":
          res.status(500).send(JSON.stringify(obj));
          break;
        default:
          res.status(500).send(err);
          break;
      }
      return;
    }
    res
      .status(200)
      .send(JSON.stringify({ roomID: room[0].GetID(), err: undefined }));
  } else {
    var roomSearch = await server.FindRoom(data.roomName);
    if (roomSearch == undefined || data.roomPass !== roomSearch.GetPassword()) {
      res
        .status(404)
        .send(
          `{"error":"Room not found or password is incorrect.","mistake":3}`
        );
      return;
    }
    if (roomSearch.HasStarted()) {
      res
        .status(403)
        .send(`{"error":"Room has already started. Try joining later."}`);
      return;
    }
    if (roomSearch.GetClientCount() >= MAX_ROOM_MEMBER_COUNT) {
      res.status(403).send(`{"error":"Room is full."}`);
      return;
    }

    res
      .status(200)
      .send(JSON.stringify({ roomID: roomSearch.GetID(), err: undefined }));
  }
});

router.post("/api/join", async function (req, res) {
  // For direct users that only provide a room ID
  const body = req.body;
  const data = new JoinRequest(body.nickname, body.roomID);
  if (!data.Sanitize()) return;

  try {
    const valid = ValidJoinRequest(data);
    if (!valid[1]) {
      res
        .status(400)
        .send(JSON.stringify({ error: valid[0], mistake: valid[2] }));
      return;
    }
  } catch {
    return;
  }

  var room = await server.FindRoomByID(data.roomID);
  if (!room) {
    res.status(400).send(`{"error":"Room not found."}`);
    return;
  } // This shouldn't happen since /api/exist is checked first
  if (room.HasStarted()) {
    res
      .status(403)
      .send(`{"error":"Room has already started. Try joining later."}`);
    return;
  }
  if (room.GetClientCount() >= MAX_ROOM_MEMBER_COUNT) {
    res.status(403).send(`{"error":"Room is full."}`);
    return;
  }
  res.status(200).send(JSON.stringify({ err: undefined }));
});

router.get("/api/stats", (req, res) => {
  res.contentType("json");
  res.send(
    `{\n    "clients": ${metrics.ClientCount()},\n    "rooms": ${metrics.RoomCount()}\n}`
  );
});

export default router;
