import React from 'react';
import './App.css';
import Entry from './pages/entry';
import Loading from './pages/loading';
import { Game } from './pages/game';
import NotFoundPage from './pages/404-page';
import DirectLogin from './pages/direct-login';

import { Route, Switch, useHistory, withRouter } from 'react-router-dom';
import { StaticView } from './pages/static-view';

import { WSC_Reason_Kicked, WSC_Reason_Room_Close } from './protocol';

export interface LoadingResult {
  doneLoading: boolean;
  roomName: string | undefined; 
  roomFound: boolean | undefined; // Will be undefined during menu
} 

function App () {
  let history = useHistory();
  const [loadingResult, setLoadingResult] = React.useState<LoadingResult>({doneLoading: false, roomName: undefined, roomFound: undefined});
  const [nickname, setNickname] = React.useState<string | undefined>(undefined);
  const [roomID, setRoomID] = React.useState<string | undefined>(undefined);
  const [playerID, setPlayerID] = React.useState<string | undefined>(undefined); 
  const [returnError, setReturnError] = React.useState<string | undefined>(undefined);
  const leave = () => history.push('/'); // Reset back to the home page
  const kicked = (reason: string) => {
    switch (reason) {
      case WSC_Reason_Kicked:
        setReturnError('You have been kicked.'); 
        break;
      case WSC_Reason_Room_Close:
        setReturnError('Room closed due to inactivity.');
        break;
    }   
    history.push('/'); 
  }
  
  const onLoad = (roomName: string | undefined, roomFound: boolean | undefined) => { setLoadingResult({doneLoading: true, roomName: roomName, roomFound: roomFound}); }
  const onDirectRoomLoad = async (roomName: string | undefined, roomFound: boolean | undefined) => {
    setLoadingResult({doneLoading: true, roomName: roomName, roomFound: roomFound});
    setRoomID(roomName);
  }

  const onDirectLogin = (name: string, playerID: string) => { setNickname(name); setPlayerID(playerID); } // No need to set history since user is already in room
  const login = (roomId: string, name: string, playerID: string) => {
    setLoadingResult({doneLoading: true, roomName: roomID, roomFound: true}); // If the user goes through the menu (not using a direct link) the room is always found
    setRoomID(roomId);
    setNickname(name);
    setPlayerID(playerID);

    try { history.push(`/room/${roomId}`); } catch { window.location.reload(); }
  }
  
  return (
    <div className='root'>
      <Switch>
        <Route exact path='/'>
          { loadingResult.doneLoading ? <Entry onLogin={login} error={returnError}/> : <Loading callbackFunc={onLoad}/> }
        </Route>
        <Route path='/room/:id'> {/* All properties need to be defined to send a ws request */}
          { loadingResult.doneLoading ? (
            loadingResult.roomFound == true && roomID ?
          (playerID ? <Game roomID={roomID} nickname={nickname?nickname:'a'} playerID={playerID} leave={leave} kicked={kicked}/> :<
            DirectLogin roomName={roomID} callbackFunc={onDirectLogin}/>) :
          <NotFoundPage message='Room not found.'/>
          ) : <Loading callbackFunc={onDirectRoomLoad} /> }
        </Route>
      </Switch>
    </div>
  );
}

export default withRouter(App);
