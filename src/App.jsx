import { useState } from 'react'
import Lobby from './components/Lobby.jsx'
import Game from './components/Game.jsx'
import './styles.css'

export default function App() {
  const [session, setSession] = useState(null)
  // session = { roomCode, playerSlot, playerName }

  if (session) {
    return <Game session={session} onLeave={() => setSession(null)} />
  }
  return <Lobby onJoin={setSession} />
}
