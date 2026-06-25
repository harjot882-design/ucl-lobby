import { useState } from 'react'

function factCheck(clue, p) {
  const c = clue.toLowerCase()
  const nameParts = p.name.toLowerCase().split(' ')
  for (const part of nameParts) {
    if (part.length > 3 && c.includes(part)) return { ok: false, msg: '⚠️ Clue might reveal the player name!' }
  }
  if (p.club && p.club !== 'Retired' && c.includes(p.club.toLowerCase())) return { ok: false, msg: '⚠️ Clue mentions their current club!' }
  if (/\b(striker|forward|cf)\b/.test(c) && p.pos !== 'FW') return { ok: false, msg: `❌ ${p.name} is a ${p.pos}, not a forward.`, fix: `He plays as a ${posName(p.pos)}` }
  if (/\bmidfielder\b/.test(c) && p.pos !== 'MF') return { ok: false, msg: `❌ ${p.name} is a ${p.pos}, not a midfielder.`, fix: `He plays as a ${posName(p.pos)}` }
  if (/\b(defender|centre.back)\b/.test(c) && p.pos !== 'DF') return { ok: false, msg: `❌ ${p.name} is a ${p.pos}, not a defender.`, fix: `He plays as a ${posName(p.pos)}` }
  if (/\bgoalkeeper\b/.test(c) && p.pos !== 'GK') return { ok: false, msg: `❌ ${p.name} is a ${p.pos}, not a goalkeeper.`, fix: `He plays as a ${posName(p.pos)}` }
  if (/left.foot/.test(c) && p.foot !== 'left') return { ok: false, msg: `❌ ${p.name} is right-footed.`, fix: 'He is right-footed' }
  if (/right.foot/.test(c) && p.foot !== 'right') return { ok: false, msg: `❌ ${p.name} is left-footed.`, fix: 'He is left-footed' }
  if (/never won/.test(c) && p.ucl_wins > 0) return { ok: false, msg: `❌ ${p.name} has won the UCL ${p.ucl_wins} time(s).`, fix: `He has won the UCL ${p.ucl_wins} time(s)` }
  if (/won.*once/.test(c) && p.ucl_wins !== 1) return { ok: false, msg: `❌ ${p.name} has won the UCL ${p.ucl_wins} time(s).`, fix: `He has won the UCL ${p.ucl_wins} time(s)` }
  return { ok: true }
}

function posName(pos) {
  return { GK: 'goalkeeper', DF: 'defender', MF: 'midfielder', FW: 'forward' }[pos] || pos
}

export default function ClueEntry({ playerName, player, timerDisplay, onSubmit }) {
  const [clues, setClues] = useState(['', '', ''])
  const [checks, setChecks] = useState([null, null, null])

  function updateClue(i, val) {
    const next = [...clues]; next[i] = val; setClues(next)
    if (val.trim() && player) {
      const result = factCheck(val, player)
      const nextChecks = [...checks]; nextChecks[i] = result; setChecks(nextChecks)
    } else {
      const nextChecks = [...checks]; nextChecks[i] = null; setChecks(nextChecks)
    }
  }

  function applyFix(i, fix) {
    updateClue(i, fix)
  }

  function submit() {
    const filled = clues.map(c => c.trim() || 'No clue given')
    onSubmit(filled)
  }

  return (
    <div className="clue-screen">
      <div className="phase-header">
        <div className="phase-label">{playerName}'s clues</div>
        <div className="phase-title">Write 3 Clues</div>
      </div>
      <div className="look-away-banner">🔒 Don't give away who you picked!</div>

      <div className="timer-bar">
        <span className="timer-label">Time to write</span>
        <span className="timer-val">{timerDisplay}</span>
      </div>

      <div className="clue-list">
        {[0,1,2].map(i => (
          <div key={i}>
            <div className="clue-row">
              <span className="clue-num">{i+1}</span>
              <input
                className="clue-input"
                value={clues[i]}
                onChange={e => updateClue(i, e.target.value)}
                placeholder={['e.g. He plays as a midfielder','e.g. He has won the UCL more than once','e.g. He is not European'][i]}
              />
              <span className="clue-status">{checks[i] ? (checks[i].ok ? '✅' : '⚠️') : ''}</span>
            </div>
            {checks[i] && !checks[i].ok && (
              <div className="clue-feedback">
                {checks[i].msg}
                {checks[i].fix && <button className="fix-btn" onClick={() => applyFix(i, checks[i].fix)}>Use: "{checks[i].fix}"</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={submit} style={{ marginTop: 12 }}>Lock In Clues</button>
    </div>
  )
}
