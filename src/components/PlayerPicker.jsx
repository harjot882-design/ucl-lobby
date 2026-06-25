import { useState } from 'react'
import { PLAYERS } from '../data/players.js'

export default function PlayerPicker({ onPick }) {
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const tabs = ['ALL','GK','DF','MF','FW']
  const filtered = PLAYERS.filter(p => {
    if (filter !== 'ALL' && p.pos !== filter) return false
    if (search.length >= 2) { const s = search.toLowerCase(); return p.name.toLowerCase().includes(s) || p.club.toLowerCase().includes(s) }
    return true
  })
  return (
    <div>
      <input className="inp" placeholder="Search name or club..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:9}}/>
      <div className="ptabs">
        {tabs.map(t=><button key={t} className={`ptab${filter===t?' on':''}`} onClick={()=>setFilter(t)}>{t==='ALL'?'All':t}</button>)}
      </div>
      <div className="pgrid">
        {filtered.map(p=>(
          <div key={p.name} className="pcard" onClick={()=>onPick(p)}>
            <div className="pav" style={{background:p.col}}>{p.initials}</div>
            <div className="pn">{p.name}</div>
            <div className="pc">{p.pos} · {p.club}</div>
            <span className="papps">{p.apps} apps</span>
          </div>
        ))}
      </div>
    </div>
  )
}
