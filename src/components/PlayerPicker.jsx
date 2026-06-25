import { useState } from 'react'
import { PLAYERS } from '../data/players'

export default function PlayerPicker({ playerName, onConfirm }) {
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')
  const [selected, setSelected] = useState(null)

  const filtered = PLAYERS.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.club.toLowerCase().includes(search.toLowerCase()) || p.nation.toLowerCase().includes(search.toLowerCase())
    const matchPos = posFilter === 'ALL' || p.pos === posFilter
    return matchSearch && matchPos
  })

  return (
    <div className="picker-screen">
      <div className="phase-header">
        <div className="phase-label">{playerName}'s turn</div>
        <div className="phase-title">Choose Your Player</div>
      </div>
      <div className="look-away-banner">🔒 Other player — look away!</div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player, club or nation..." />
      </div>

      <div className="pos-tabs">
        {['ALL','GK','DF','MF','FW'].map(pos => (
          <button key={pos} className={`pos-tab ${posFilter === pos ? 'active' : ''}`} onClick={() => setPosFilter(pos)}>{pos}</button>
        ))}
      </div>

      <div className="player-grid">
        {filtered.map(p => (
          <div key={p.name} className={`player-card ${selected?.name === p.name ? 'selected' : ''}`} onClick={() => setSelected(p)}>
            <div className="p-flag">{p.flag}</div>
            <div className="p-name">{p.name}</div>
            <div className="p-club">{p.club}</div>
            <div className="p-apps">{p.ucl_apps} UCL apps</div>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={() => selected && onConfirm(selected)} disabled={!selected} style={{ marginTop: 12 }}>
        Lock In — {selected ? selected.name : 'pick a player'}
      </button>
    </div>
  )
}
