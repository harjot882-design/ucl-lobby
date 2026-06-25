import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'UCL-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function Lobby({ onJoin }) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lobby, setLobby] = useState(null) // { room, playerId, playerName }

  // Once in lobby, subscribe to room updates
  useEffect(() => {
    if (!lobby) return
    const channel = supabase
      .channel(`lobby-${lobby.room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${lobby.room.id}` }, payload => {
        const gs = payload.new.game_state
        if (gs.phase === 'picking') {
          // Owner started the game
          onJoin({ ...lobby.room, ...payload.new }, lobby.playerId, lobby.playerName)
        } else {
          setLobby(prev => ({ ...prev, room: { ...prev.room, game_state: gs } }))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [lobby])

  async function createRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    setLoading(true); setError('')
    const code = randomCode()
    const gs = { phase: 'lobby', players: [{ id: 'p1', name: name.trim(), score: 0 }] }
    const { data, error: err } = await supabase
      .from('rooms').insert({ code, p1_name: name.trim(), status: 'waiting', game_state: gs })
      .select().single()
    setLoading(false)
    if (err) { setError('Could not create room: ' + err.message); return }
    setLobby({ room: data, playerId: 'p1', playerName: name.trim() })
  }

  async function joinRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    if (!joinCode.trim()) { setError('Enter a room code'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.from('rooms').select('*').eq('code', joinCode.trim().toUpperCase()).single()
    if (err || !data) { setLoading(false); setError('Room not found'); return }
    const gs = data.game_state
    if (gs.phase !== 'lobby') { setLoading(false); setError('Game already started'); return }
    const players = gs.players || []
    if (players.length >= 4) { setLoading(false); setError('Room is full (max 4 players)'); return }
    const playerId = `p${players.length + 1}`
    const newPlayers = [...players, { id: playerId, name: name.trim(), score: 0 }]
    const newGs = { ...gs, players: newPlayers }
    const { error: upErr } = await supabase.from('rooms').update({ game_state: newGs, p2_name: name.trim() }).eq('id', data.id)
    setLoading(false)
    if (upErr) { setError('Could not join room'); return }
    setLobby({ room: { ...data, game_state: newGs }, playerId, playerName: name.trim() })
  }

  async function startGame() {
    const gs = lobby.room.game_state
    const players = gs.players
    // Pick random clue-giver for round 1
    const clueGiverIdx = Math.floor(Math.random() * players.length)
    const newGs = {
      phase: 'picking',
      players,
      scores: Object.fromEntries(players.map(p => [p.id, 0])),
      round: 1,
      total_rounds: players.length,
      clue_giver: players[clueGiverIdx].id,
      clue_giver_order: shuffleOrder(players.map(p => p.id), clueGiverIdx),
      round_clue_giver_idx: 0,
    }
    await supabase.from('rooms').update({ game_state: newGs, status: 'active' }).eq('id', lobby.room.id)
    onJoin(lobby.room, lobby.playerId, lobby.playerName)
  }

  function shuffleOrder(ids, startIdx) {
    const result = []
    for (let i = 0; i < ids.length; i++) result.push(ids[(startIdx + i) % ids.length])
    return result
  }

  // ── LOBBY WAITING ROOM ───────────────────────────────────────────────────
  if (lobby) {
    const gs = lobby.room.game_state
    const players = gs.players || []
    const isOwner = lobby.playerId === 'p1'
    return (
      <div className="lobby">
        <div className="ucl-logo">
          <div className="logo-star">⭐</div>
          <div className="logo-champions">UCL Guesser</div>
        </div>
        <div className="card">
          <div className="room-code-display">
            <div className="rcd-label">Room Code — share with friends</div>
            <div className="rcd-code">{lobby.room.code}</div>
          </div>
          <div className="players-list">
            <div className="pl-label">Players in lobby ({players.length}/4)</div>
            {players.map((p, i) => (
              <div key={p.id} className="pl-row">
                <span className="pl-dot">●</span>
                <span className="pl-name">{p.name}</span>
                {i === 0 && <span className="pl-crown">👑 Host</span>}
              </div>
            ))}
            {players.length < 4 && (
              <div className="pl-row pl-waiting">
                <span className="pl-dot" style={{color:'#333'}}>●</span>
                <span style={{color:'#444',fontStyle:'italic'}}>Waiting for players...</span>
              </div>
            )}
          </div>
          {isOwner ? (
            <button className="btn-primary" onClick={startGame} disabled={players.length < 2} style={{marginTop:16}}>
              {players.length < 2 ? 'Need at least 2 players' : `Start Game (${players.length} players)`}
            </button>
          ) : (
            <div className="hint" style={{marginTop:16,textAlign:'center',color:'#aaa'}}>Waiting for host to start the game...</div>
          )}
        </div>
      </div>
    )
  }

  // ── JOIN / CREATE ────────────────────────────────────────────────────────
  return (
    <div className="lobby">
      <div className="ucl-logo">
        <div className="logo-star">⭐</div>
        <div className="logo-uefa">UEFA</div>
        <div className="logo-champions">Champions</div>
        <div className="logo-league">League</div>
        <div className="logo-sub">Guesser</div>
      </div>
      <div className="card">
        <div className="tab-row">
          <button className={`tab-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => { setTab('create'); setError('') }}>Create Room</button>
          <button className={`tab-btn ${tab === 'join' ? 'active' : ''}`} onClick={() => { setTab('join'); setError('') }}>Join Room</button>
        </div>
        <div className="field">
          <label>Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Marco" maxLength={20} />
        </div>
        {tab === 'join' && (
          <div className="field">
            <label>Room Code</label>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="UCL-XXXX" maxLength={8} />
          </div>
        )}
        {error && <div className="error-msg">{error}</div>}
        <button className="btn-primary" onClick={tab === 'create' ? createRoom : joinRoom} disabled={loading}>
          {loading ? 'Loading...' : tab === 'create' ? 'Create Game' : 'Join Game'}
        </button>
        {tab === 'create' && <p className="hint">A room code will appear — share it with friends</p>}
      </div>
    </div>
  )
}
