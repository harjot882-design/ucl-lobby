import { useState } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'

export default function App() {
  const [session, setSession] = useState(null)
  return (
    <div className="app-root">
      <div className="hex-bg" />
      {!session
        ? <Lobby onJoin={(roomId, playerId, playerName) => setSession({ roomId, playerId, playerName })} />
        : <Game
            roomId={session.roomId}
            playerId={session.playerId}
            playerName={session.playerName}
            onLeave={() => setSession(null)}
          />
      }
    </div>
  )
}
