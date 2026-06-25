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
  const [lobby, setLobby] = useState(null) // { roomId, playerId, playerName, players, hostId, code }

  // Subscribe to room updates while waiting in lobby
  useEffect(() => {
    if (!lobby) return
    const channel = supabase
      .channel(`lobby-${lobby.roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${lobby.roomId}`
      }, payload => {
        const gs = payload.new.game_state
        if (!gs) return
        if (gs.phase === 'pick_player') {
          // Host started — move everyone into Game
          onJoin(lobby.roomId, lobby.playerId, lobby.playerName)
        } else {
          // Update player list while still in lobby
          setLobby(prev => ({ ...prev, players: Object.values(gs.players || {}) }))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [lobby?.roomId])

  async function createRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    setLoading(true); setError('')
    const code = randomCode()
    const playerId = crypto.randomUUID()
    const gs = {
      phase: 'lobby',
      hostId: playerId,
      players: { [playerId]: { id: playerId, name: name.trim() } },
      scores: {},
      round: 0,
      roundOrder: [],
      clueGiver: null,
      secretPlayer: null,
      clues: [],
      guessesLeft: {},
      guessersDone: {},
      correctGuessers: {},
      roundPoints: {},
    }
    const { data, error: err } = await supabase
      .from('rooms').insert({ code, status: 'waiting', game_state: gs })
      .select().single()
    setLoading(false)
    if (err) { setError('Could not create room: ' + err.message); return }
    setLobby({
      roomId: data.id,
      playerId,
      playerName: name.trim(),
      players: [{ id: playerId, name: name.trim() }],
      hostId: playerId,
      code,
    })
  }

  async function joinRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    if (!joinCode.trim()) { setError('Enter a room code'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase
      .from('rooms').select('*').eq('code', joinCode.trim().toUpperCase()).single()
    if (err || !data) { setLoading(false); setError('Room not found'); return }
    const gs = data.game_state
    if (gs.phase !== 'lobby') { setLoading(false); setError('Game already started'); return }
    const existing = Object.keys(gs.players || {})
    if (existing.length >= 4) { setLoading(false); setError('Room is full (max 4 players)'); return }
    const playerId = crypto.randomUUID()
    const newGs = {
      ...gs,
      players: { ...gs.players, [playerId]: { id: playerId, name: name.trim() } }
    }
    const { error: upErr } = await supabase.from('rooms').update({ game_state: newGs }).eq('id', data.id)
    setLoading(false)
    if (upErr) { setError('Could not join room'); return }
    setLobby({
      roomId: data.id,
      playerId,
      playerName: name.trim(),
      players: Object.values(newGs.players),
      hostId: gs.hostId,
      code: data.code,
    })
  }

  // ── LOBBY WAITING ROOM ───────────────────────────────────────────────────
  if (lobby) {
    const isHost = lobby.playerId === lobby.hostId
    const players = lobby.players || []
    return (
      <div className="lobby">
        <div className="ucl-logo">
          <div className="logo-star">⭐</div>
          <div className="logo-champions">UCL Guesser</div>
        </div>
        <div className="card">
          <div className="room-code-display">
            <div className="rcd-label">Room Code — share with friends</div>
            <div className="rcd-code">{lobby.code}</div>
          </div>
          <div className="players-list">
            <div className="pl-label">Players in lobby ({players.length}/4)</div>
            {players.map((p) => (
              <div key={p.id} className="pl-row">
                <span className="pl-dot">●</span>
                <span className="pl-name">{p.name}</span>
                {p.id === lobby.hostId && <span className="pl-crown">👑 Host</span>}
              </div>
            ))}
            {players.length < 4 && (
              <div className="pl-row pl-waiting">
                <span className="pl-dot" style={{ color: '#333' }}>●</span>
                <span style={{ color: '#444', fontStyle: 'italic' }}>Waiting for players...</span>
              </div>
            )}
          </div>
          {isHost ? (
            <button
              className="btn-primary"
              onClick={startGame}
              disabled={players.length < 2}
              style={{ marginTop: 16 }}
            >
              {players.length < 2 ? 'Need at least 2 players' : `▶ Start Game (${players.length} players)`}
            </button>
          ) : (
            <div className="hint" style={{ marginTop: 16, textAlign: 'center', color: '#aaa' }}>
              Waiting for host to start the game...
            </div>
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

  async function startGame() {
    // Fetch fresh state then set phase to pick_player
    const { data } = await supabase.from('rooms').select('game_state').eq('id', lobby.roomId).single()
    const current = data?.game_state ?? {}
    const playerIds = Object.keys(current.players ?? {})
    if (playerIds.length < 2) return
    const giverId = playerIds[Math.floor(Math.random() * playerIds.length)]
    await supabase.from('rooms').update({
      status: 'active',
      game_state: {
        ...current,
        phase: 'pick_player',
        clueGiver: giverId,
        round: 1,
        scores: Object.fromEntries(playerIds.map(id => [id, 0])),
        roundOrder: [giverId],
        guessesLeft: {},
        guessersDone: {},
        correctGuessers: {},
        roundPoints: {},
        clues: [],
        secretPlayer: null,
      }
    }).eq('id', lobby.roomId)
    // Host transitions immediately; others get it via subscription
    onJoin(lobby.roomId, lobby.playerId, lobby.playerName)
  }
}
