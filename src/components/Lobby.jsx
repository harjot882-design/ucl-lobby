import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Background from './Background.jsx'
import UCLHeader from './UCLHeader.jsx'

function makeCode() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'UCL-' + Array.from({length:4},()=>c[Math.floor(Math.random()*c.length)]).join('')
}

export default function Lobby({ onJoin }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [view, setView] = useState('home')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function createRoom() {
    if (!name.trim()) { setErr('Enter your name'); return }
    setLoading(true); setErr('')
    const roomCode = makeCode()
    const player = { slot: 1, name: name.trim(), score: 0, role: null }
    const { error } = await supabase.from('rooms').insert({
      code: roomCode,
      phase: 'waiting',
      players: [player],
      scores: { '1': 0 },
    })
    setLoading(false)
    if (error) { setErr('Could not create room: ' + error.message); return }
    onJoin({ roomCode, playerSlot: 1, playerName: name.trim() })
  }

  async function joinRoom() {
    if (!name.trim()) { setErr('Enter your name'); return }
    if (!code.trim()) { setErr('Enter a room code'); return }
    setLoading(true); setErr('')
    const roomCode = code.trim().toUpperCase()
    const { data, error } = await supabase.from('rooms').select('*').eq('code', roomCode).single()
    if (error || !data) { setLoading(false); setErr('Room not found'); return }
    if (data.phase !== 'waiting') { setLoading(false); setErr('Game already started'); return }
    const players = data.players || []
    if (players.length >= 4) { setLoading(false); setErr('Room is full (max 4 players)'); return }
    const slot = players.length + 1
    const newPlayer = { slot, name: name.trim(), score: 0, role: null }
    const updatedPlayers = [...players, newPlayer]
    const updatedScores = { ...data.scores, [slot]: 0 }
    const { error: upErr } = await supabase.from('rooms').update({
      players: updatedPlayers,
      scores: updatedScores,
    }).eq('code', roomCode)
    setLoading(false)
    if (upErr) { setErr('Could not join room'); return }
    onJoin({ roomCode, playerSlot: slot, playerName: name.trim() })
  }

  return (
    <div className="shell">
      <Background/>
      <div className="content">
        <UCLHeader/>
        <div className="pad" style={{maxWidth:400,margin:'0 auto'}}>
          <div className="slbl" style={{marginBottom:20}}>Get started</div>
          {view === 'home' && <>
            <input className="inp" placeholder="Your name..." value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createRoom()} style={{marginBottom:12}}/>
            <button className="btn btn-glow" style={{width:'100%',marginBottom:10,fontSize:13,padding:13}} onClick={createRoom} disabled={loading}>
              {loading ? <><span className="spin"/>Creating...</> : '⚽ Create a room'}
            </button>
            <button className="btn btn-ghost" style={{width:'100%',fontSize:13,padding:13}} onClick={()=>setView('join')}>🔗 Join with a code</button>
            {err && <div style={{color:'#fca5a5',fontSize:12,marginTop:10,textAlign:'center'}}>{err}</div>}
          </>}
          {view === 'join' && <>
            <input className="inp" placeholder="Your name..." value={name} onChange={e=>setName(e.target.value)} style={{marginBottom:10}}/>
            <input className="inp" placeholder="Room code e.g. UCL-A4B2" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&joinRoom()} style={{marginBottom:12,letterSpacing:'.1em',fontWeight:700}}/>
            <button className="btn btn-glow" style={{width:'100%',marginBottom:10,fontSize:13,padding:13}} onClick={joinRoom} disabled={loading}>
              {loading ? <><span className="spin"/>Joining...</> : '🔗 Join game'}
            </button>
            <button className="btn btn-ghost" style={{width:'100%'}} onClick={()=>setView('home')}>← Back</button>
            {err && <div style={{color:'#fca5a5',fontSize:12,marginTop:10,textAlign:'center'}}>{err}</div>}
          </>}
        </div>
      </div>
    </div>
  )
}
