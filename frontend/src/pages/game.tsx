import React from 'react';
import useWebSocket from 'react-use-websocket';
import { useLocalStorage } from '@rehooks/local-storage';
import { reloadOutdatedPage, websocketUrl } from '../common';
import { version as qspyVersion } from '../metadata.json';


import { Sender, GameView } from './game-view';
import { ClientPacket, ServerPacket, State } from '../protocol';

const socketUrl = websocketUrl('/api/ws');

export const UserContext = React.createContext<Boolean>(false); // This will be the context that determines if local player is host (true)

function useSender(dispatch: (action: ClientPacket) => void) {
    return React.useMemo<Sender>(() => {
        return { // Synced with protocol (../protocol/index.ts)
            changeNickname: (nickname: string) => dispatch({method: 'changeNickname', params: { nickname }}),
            kickPlayer: (discriminator: number) => dispatch({method: 'kickPlayer', params: { discriminator }}),
            changeTime: (time: number) => dispatch({method: 'changeTime', params: { time }}),
            startGame: () => dispatch({method: 'startGame', params: {}}),
            createVote: (target: number) => dispatch({method: 'createVote', params: { target }}),
            vote: (agreement: boolean) => dispatch({method: 'vote', params: { agreement }}),
            guessLocation: (guess: string) => dispatch({method: 'guessLocation', params: { guess }}),
            playAgain: () => dispatch({method: 'playAgain', params: {}})
        }
    }, [dispatch]);
}

const reconnectAttempts = 2;

function useWS(roomID:string, playerID:string, nickname:string, dead: () => void, onOpen: () => void, closed: (reason: string) => void) {
    const didUnmont = React.useRef(false);
    const retry = React.useRef(0);

    return useWebSocket(socketUrl, {
        queryParams: { roomID: roomID, playerID: playerID, nickname:nickname, qspyVersion: qspyVersion },
        onMessage: () => retry.current = 0,
        onOpen,
        onClose: (e: CloseEvent) => { 
            if (e.code == 4418) { reloadOutdatedPage(); return }
            closed(e.reason);
        },
        shouldReconnect: () => {
            if (didUnmont.current) { return false; }
            retry.current++;
            if (retry.current >= reconnectAttempts) { dead(); return false; }
            return true;
        }
    });
}

type StateAction = { method: 'setState'; state: State } | ClientPacket; // The action to accept from the server

function useStateReducer (sendPacket: (r: ClientPacket) => void) {
    const sendPacketRef = React.useRef(sendPacket); // Create a reference to the current packet
    sendPacketRef.current = sendPacket;

    return React.useCallback((state: State | undefined, action: StateAction): State | undefined => {
        if (state === undefined) { 
            if (action.method === 'setState') return action.state
            return state;
        }

        switch (action.method) {
            case 'setState':
                return action.state;
            default:
                sendPacketRef.current({ ...action });
                return state;
        }
    }, [sendPacketRef]);
}

export interface GameProps {
    roomID: string;
    nickname: string;
    playerID: string; // Needs to be defined (otherwise in a different state)
    leave: () => void;
    kicked: (reason: string) => void;
}

export const Game = (props: GameProps) => {
    const nickname = React.useRef(props.nickname); 
    const [hasPlayed, setHasPlayed] = useLocalStorage<boolean>('hasPlayed', false);
    const { sendJsonMessage, lastJsonMessage } = useWS(props.roomID, props.playerID, nickname.current, props.leave, () => {}, (reason: string) => {
        props.kicked(reason); // Kicked refers to kicked from the room (could be because of inactivity or other reasons, not just host kicking)
    });
    const reducer = useStateReducer(sendJsonMessage);
    const [state, dispatch] = React.useReducer(reducer, undefined);
    const send = useSender(dispatch);

    window.addEventListener('beforeunload', (e => {
        if (!state?.roomState.started) return;
        e.preventDefault();
        e.returnValue = 'Are you sure? If you reload the page, you will be kicked from the game.';
    }));

    React.useEffect(() => { // Set has played to true after 5 seconds of reading
        if (hasPlayed) return;
        setTimeout(() => {
            setHasPlayed(true);
        }, 5000);
    }, [])

    React.useEffect(() => {
        if (!lastJsonMessage) return;
        const serverPacket = ServerPacket.parse(lastJsonMessage); // Parses JSON into packet
        switch (serverPacket.method) {
            case 'state':
                dispatch({method: 'setState', state: serverPacket.params});
                break;
            default:
                throw new Error('Unexpected object: ' + serverPacket.method);
        }
    }, [lastJsonMessage]);

    if (!state || !props.playerID) { return(<div className='appMount'></div>); }

    return (
        <UserContext.Provider value={state.me.isHost}>
            <GameView 
            roomName={props.roomID} 
            send={send} 
            state={state.roomState} 
            me={state.me} 
            leave={props.leave}
            hasUserPlayed={hasPlayed}
            />
        </UserContext.Provider>
    );
}