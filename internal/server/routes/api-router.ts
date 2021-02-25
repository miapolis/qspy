import express, { NextFunction } from 'express';
var router = express.Router();

import { Version } from '../../version/version';
import { RoomRequest, Valid } from '../../protocol';
import { server } from '../../main';
import { MAX_ROOM_MEMBER_COUNT } from '../server';
import * as metrics from '../metrics';

export const checkVersion = (req:any, res:any, next: NextFunction) => {
    const clientVersion = req.header('X-QSPY-VERSION');
    if (clientVersion == undefined || clientVersion != Version()) { 
        res.status(418).send('Version does not match API version.');
        return;
    }
    
    next();
}

router.use('/api/exists', checkVersion);
router.use('/api/room', checkVersion);

router.get('/api/exists', async function(req, res) {
    if (!req.query.roomID) { res.sendStatus(400); return; }
    const roomID = req.query.roomID.toString();
    var room = await server.FindRoom(roomID);
    if (room == undefined) res.sendStatus(404); 
    else res.sendStatus(200);
});

router.post('/api/room', async function(req, res) {
    const body = req.body;
    const data = new RoomRequest(body.nickname, body.roomName, body.create);
    data.Sanitize();

    // Validate their nickname and other parameters
    try { const valid = Valid(data); if (!valid[1]) { res.status(400).send(JSON.stringify({error: valid[0], mistake: valid[2]})); return; } } catch { return; }

    if (data.create) {
        var room = await server.CreateRoom(data.roomName);
        if (room[1] != undefined || !room[0]) { // Something has failed
            const err = room[1];
            var obj = { playerID: undefined, error: err };
            switch(err) {
                case 'Too many rooms.':
                    res.status(503).send(JSON.stringify(obj));
                    break;
                case 'Room already exists.':
                    res.status(400).send(JSON.stringify(obj));
                    break;
                case 'Unknown error.':
                    res.status(500).send(JSON.stringify(obj));
                    break;
                default: 
                    res.status(500).send(err);
                    break;
            }
            return;
        }
        let playerID = await room[0].GeneratePlayerID();
        res.status(200).send(JSON.stringify({playerID: playerID, err: undefined}));
    }
    else {
        var roomSearch = await server.FindRoom(data.roomName);
        if (roomSearch == undefined) { res.status(404).send(`{"error":"Room not found."}`); return; }
        if (roomSearch.HasStarted()) { res.status(403).send(`{"error":"Room has already started. Try joining later."}`); return; }
        if (roomSearch.GetClientCount() >= MAX_ROOM_MEMBER_COUNT) { res.status(403).send(`{"error":"Room is full."}`); return; }

        let playerID = await roomSearch.GeneratePlayerID();
        res.status(200).send(JSON.stringify({playerID: playerID, err: undefined}));
    }
});

router.get('/api/stats', (req, res) => {
    res.contentType('json');
    res.send(`{\n    "clients": ${metrics.ClientCount()},\n    "rooms": ${metrics.RoomCount()}\n}`);
});

export default router;