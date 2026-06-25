import { useState } from 'react'
import { supabase } from '../lib/supabase'

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'UCL-' + Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function Lobby({ onJoin }) {
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab] = useState('create') // 'create' | 'join'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    setLoading(true)
    setError('')
    const code = randomCode()
    const { data, error: err } = await supabase
      .from('rooms')
      .insert({ code, p1_name: name.trim(), status: 'waiting', game_state: { phase: 'picking' } })
      .select()
      .single()
    if (err) { setError('Could not create room. Check your Supabase setup.'); setLoading(false); return }
    onJoin(data, 'p1')
    setLoading(false)
  }

  async function joinRoom() {
    if (!name.trim()) { setError('Enter your name first'); return }
    if (!joinCode.trim()) { setError('Enter a room code'); return }
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from('rooms')
      .update({ p2_name: name.trim(), status: 'active' })
      .eq('code', joinCode.trim().toUpperCase())
      .eq('status', 'waiting')
      .select()
      .single()
    if (err || !data) { setError('Room not found or already started.'); setLoading(false); return }
    onJoin(data, 'p2')
    setLoading(false)
  }

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

        {tab === 'create' && (
          <p className="hint">A room code will appear — share it with your opponent</p>
        )}
      </div>
    </div>
  )
}
