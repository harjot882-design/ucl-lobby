import { useState } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'

export default function App() {
  const [session, setSession] = useState(null)

  return (
    <div className="app-root">
      <div className="hex-bg" />
      {!session
        ? <Lobby onJoin={(room, playerId, playerName) => setSession({ room, playerId, playerName })} />
        : <Game room={session.room} playerId={session.playerId} playerName={session.playerName} onLeave={() => setSession(null)} />
      }
    </div>
  )
}
