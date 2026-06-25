import { useState } from 'react'
import Lobby from './components/Lobby'
import Game from './components/Game'

export default function App() {
  const [session, setSession] = useState(null)
  // session = { room, playerId }

  return (
    <div className="app-root">
      <div className="hex-bg" />
      {!session
        ? <Lobby onJoin={(room, playerId) => setSession({ room, playerId })} />
        : <Game
            room={session.room}
            playerId={session.playerId}
            onLeave={() => setSession(null)}
          />
      }
    </div>
  )
}
