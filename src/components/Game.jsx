import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PlayerPicker from './PlayerPicker'
import ClueEntry from './ClueEntry'
import { autoAnswer } from '../lib/autoAnswer'
import { PLAYERS } from '../data/players'

const TIMER_MS = 5 * 60 * 1000

export default function Game({ room, playerId, onLeave }) {
  const [gs, setGs] = useState(null)
  const [roomData, setRoomData] = useState(room)
  const [timerDisplay, setTimerDisplay] = useState('5:00')
  const [guessInput, setGuessInput] = useState('')
  const [dropdown, setDropdown] = useState([])
  const [qInput, setQInput] = useState('')
  const timerRef = useRef(null)

  const isP1 = playerId === 'p1'
  const myKey = isP1 ? 'p1' : 'p2'
  const theirKey = isP1 ? 'p2' : 'p1'

  // Load initial state and subscribe to realtime changes
  useEffect(() => {
    loadState()
    const channel = supabase
      .channel(`room-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}`
      }, payload => {
        setGs(payload.new.game_state)
        if (payload.new.p2_name && !roomData.p2_name) {
          setRoomData(prev => ({ ...prev, p2_name: payload.new.p2_name }))
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadState() {
    const { data } = await supabase.from('rooms').select('*').eq('id', room.id).single()
    if (data) { setGs(data.game_state); setRoomData(data) }
  }

  // Patch game state — merge with server copy first to avoid race conditions
  async function patch(updates) {
    const { data } = await supabase.from('rooms').select('game_state').eq('id', room.id).single()
    const merged = { ...(data?.game_state || {}), ...updates }
    await supabase.from('rooms').update({ game_state: merged }).eq('id', room.id)
    setGs(merged)
    return merged
  }

  // Timer
  useEffect(() => {
    clearInterval(timerRef.current)
    if (!gs?.timer_end) return
    const tick = () => {
      const left = Math.max(0, Math.round((gs.timer_end - Date.now()) / 1000))
      const m = Math.floor(left / 60)
      const s = left % 60
      setTimerDisplay(`${m}:${s.toString().padStart(2, '0')}`)
      if (left <= 0) {
        clearInterval(timerRef.current)
        handleTimeout()
      }
    }
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [gs?.timer_end, gs?.phase])

  async function handleTimeout() {
    if (!gs) return
    if (gs.phase === 'writing_clues') {
      const myClueKey = `clues_${myKey}`
      if (!gs[myClueKey]) await patch({ [myClueKey]: ['No clue', 'No clue', 'No clue'] })
      const fresh = (await supabase.from('rooms').select('game_state').eq('id', room.id).single()).data?.game_state || {}
      if (fresh[`clues_p1`] && fresh[`clues_p2`]) {
        await patch({ phase: 'guessing_p1', timer_end: Date.now() + TIMER_MS, guesses_left_p1: 2, guesses_left_p2: 2, questions_left_p1: 3, questions_left_p2: 3, questions_p1: [], questions_p2: [], revealed_p1: 0, revealed_p2: 0 })
      }
    } else if (gs.phase === 'guessing_p1') {
      await patch({ phase: 'guessing_p2', timer_end: Date.now() + TIMER_MS, result_p1: gs.result_p1 ?? false })
    } else if (gs.phase === 'guessing_p2') {
      await patch({ phase: 'results', result_p2: gs.result_p2 ?? false })
    }
  }

  // ── WAITING FOR OPPONENT ──────────────────────────────────────────────────
  if (!gs) return <Screen><div className="waiting-center"><div className="big-emoji">⏳</div><div className="wait-title">Connecting...</div></div></Screen>

  const p1Name = roomData.p1_name || 'Player 1'
  const p2Name = roomData.p2_name || 'Player 2'
  const myName = isP1 ? p1Name : p2Name
  const theirName = isP1 ? p2Name : p1Name

  // ── WAITING FOR P2 TO JOIN ───────────────────────────────────────────────
  if (isP1 && !roomData.p2_name) {
    return (
      <Screen>
        <div className="waiting-center">
          <div className="big-emoji">🔗</div>
          <div className="wait-title">Waiting for opponent</div>
          <div className="wait-sub">Share this code with your friend:</div>
          <div className="room-code">{roomData.code}</div>
          <div className="wait-sub">They go to the site and click <strong>Join Room</strong></div>
        </div>
      </Screen>
    )
  }

  // ── PICKING ──────────────────────────────────────────────────────────────
  if (gs.phase === 'picking') {
    const myPick = gs[`pick_${myKey}`]
    const theirPick = gs[`pick_${theirKey}`]
    if (myPick) {
      return (
        <Screen>
          <div className="waiting-center">
            <div className="big-emoji">⏳</div>
            <div className="wait-title">Waiting for {theirName}...</div>
            <div className="wait-sub">They're choosing their player</div>
            <div className="picked-badge">You picked: <strong>{myPick.name}</strong></div>
          </div>
        </Screen>
      )
    }
    return (
      <Screen>
        <PlayerPicker playerName={myName} onConfirm={async (player) => {
          // Always fetch fresh state first to avoid race condition
          const { data: fresh } = await supabase.from('rooms').select('game_state').eq('id', room.id).single()
          const freshGs = fresh?.game_state || {}
          const theirPick = freshGs[`pick_${theirKey}`]
          if (theirPick) {
            await patch({ [`pick_${myKey}`]: player, phase: 'writing_clues', timer_end: Date.now() + TIMER_MS })
          } else {
            await patch({ [`pick_${myKey}`]: player })
          }
        }} />
      </Screen>
    )
  }

  // ── WRITING CLUES ────────────────────────────────────────────────────────
  if (gs.phase === 'writing_clues') {
    const myClues = gs[`clues_${myKey}`]
    const myPick = gs[`pick_${myKey}`]
    if (myClues) {
      return (
        <Screen>
          <div className="waiting-center">
            <div className="big-emoji">✍️</div>
            <div className="wait-title">Clues locked!</div>
            <div className="wait-sub">Waiting for {theirName} to finish...</div>
            <div className="timer-display">{timerDisplay}</div>
          </div>
        </Screen>
      )
    }
    return (
      <Screen>
        <ClueEntry playerName={myName} player={myPick} timerDisplay={timerDisplay} onSubmit={async (clues) => {
          // Always fetch fresh state first to avoid race condition
          const { data: fresh } = await supabase.from('rooms').select('game_state').eq('id', room.id).single()
          const freshGs = fresh?.game_state || {}
          const theirClues = freshGs[`clues_${theirKey}`]
          if (theirClues) {
            await patch({ [`clues_${myKey}`]: clues, phase: 'guessing_p1', timer_end: Date.now() + TIMER_MS, guesses_left_p1: 2, guesses_left_p2: 2, questions_left_p1: 3, questions_left_p2: 3, questions_p1: [], questions_p2: [], revealed_p1: 0, revealed_p2: 0 })
          } else {
            await patch({ [`clues_${myKey}`]: clues })
          }
        }} />
      </Screen>
    )
  }

  // ── GUESSING ─────────────────────────────────────────────────────────────
  if (gs.phase === 'guessing_p1' || gs.phase === 'guessing_p2') {
    const guesserKey = gs.phase === 'guessing_p1' ? 'p1' : 'p2'
    const defenderKey = gs.phase === 'guessing_p1' ? 'p2' : 'p1'
    const isMyTurn = myKey === guesserKey
    const guesserName = gs.phase === 'guessing_p1' ? p1Name : p2Name
    const defenderName = gs.phase === 'guessing_p1' ? p2Name : p1Name
    const defenderPlayer = gs[`pick_${defenderKey}`]
    const clues = gs[`clues_${defenderKey}`] || []
    const questions = gs[`questions_${guesserKey}`] || []
    const questionsLeft = gs[`questions_left_${guesserKey}`] ?? 3
    const guessesLeft = gs[`guesses_left_${guesserKey}`] ?? 2
    const revealed = gs[`revealed_${guesserKey}`] ?? 0
    const timerSecs = Math.max(0, Math.round(((gs.timer_end || 0) - Date.now()) / 1000))

    if (!isMyTurn) {
      return (
        <Screen>
          <div className="waiting-center">
            <div className="big-emoji">🔍</div>
            <div className="wait-title">{guesserName} is guessing...</div>
            <div className="wait-sub">They're trying to figure out your player</div>
            <div className="timer-display">{timerDisplay}</div>
          </div>
        </Screen>
      )
    }

    function handleGuessType(val) {
      setGuessInput(val)
      if (!val.trim()) { setDropdown([]); return }
      setDropdown(PLAYERS.filter(p => p.name.toLowerCase().includes(val.toLowerCase())).slice(0, 8))
    }

    async function revealClue(i) {
      if (i <= revealed) await patch({ [`revealed_${guesserKey}`]: i + 1 })
    }

    async function askQuestion() {
      if (!qInput.trim() || questionsLeft <= 0) return
      const answer = autoAnswer(qInput.toLowerCase(), defenderPlayer)
      const newQs = [...questions, { q: qInput, a: answer }]
      await patch({ [`questions_${guesserKey}`]: newQs, [`questions_left_${guesserKey}`]: questionsLeft - 1 })
      setQInput('')
    }

    async function submitGuess() {
      const val = guessInput.trim().toLowerCase()
      if (!val || guessesLeft <= 0) return
      const correct = defenderPlayer.name.toLowerCase() === val
      if (correct) {
        const nextPhase = gs.phase === 'guessing_p1' ? 'guessing_p2' : 'results'
        await patch({ result_p1: gs.phase === 'guessing_p1' ? true : gs.result_p1, result_p2: gs.phase === 'guessing_p2' ? true : gs.result_p2, phase: nextPhase, timer_end: Date.now() + TIMER_MS })
      } else {
        const newLeft = guessesLeft - 1
        if (newLeft <= 0) {
          const nextPhase = gs.phase === 'guessing_p1' ? 'guessing_p2' : 'results'
          await patch({ [`guesses_left_${guesserKey}`]: 0, result_p1: gs.phase === 'guessing_p1' ? false : gs.result_p1, result_p2: gs.phase === 'guessing_p2' ? false : gs.result_p2, phase: nextPhase, timer_end: Date.now() + TIMER_MS })
        } else {
          await patch({ [`guesses_left_${guesserKey}`]: newLeft })
          setGuessInput('')
          setDropdown([])
        }
      }
    }

    return (
      <Screen>
        <div className="phase-header">
          <div className="phase-label">Your turn to guess</div>
          <div className="phase-title">Who is {defenderName}'s player?</div>
        </div>
        <div className="timer-bar">
          <span className="timer-label">Time</span>
          <span className={`timer-val ${timerSecs < 60 ? 'danger' : timerSecs < 120 ? 'warning' : ''}`}>{timerDisplay}</span>
        </div>

        <div className="section">
          <div className="section-label">Clues — tap to reveal</div>
          {clues.map((clue, i) => (
            <div key={i} className={`clue-card ${i < revealed ? 'revealed' : 'locked'}`} onClick={() => revealClue(i)}>
              <span>{i < revealed ? '💡' : '🔒'}</span>
              <span className="clue-text">{i < revealed ? clue : '???'}</span>
              {i >= revealed && <span className="tap-hint">tap to reveal</span>}
            </div>
          ))}
        </div>

        <div className="section">
          <div className="section-label">Yes/No Questions — {questionsLeft} left</div>
          {questions.map((qa, i) => (
            <div key={i} className="qa-row">
              <span>{qa.q}</span>
              <span className={qa.a ? 'yes' : 'no'}>{qa.a ? 'YES ✅' : 'NO ❌'}</span>
            </div>
          ))}
          {questionsLeft > 0 && (
            <div className="q-row">
              <input className="q-input" value={qInput} onChange={e => setQInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askQuestion()} placeholder="e.g. Is he French? Did he play for Real Madrid?" />
              <button className="btn-ask" onClick={askQuestion}>Ask</button>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-label">Guesses — {guessesLeft} left</div>
          <div className="guess-wrap">
            <input className="guess-input" value={guessInput} onChange={e => handleGuessType(e.target.value)} placeholder="Start typing a player name..." />
            {dropdown.length > 0 && (
              <div className="dropdown">
                {dropdown.map(p => (
                  <div key={p.name} className="dd-item" onClick={() => { setGuessInput(p.name); setDropdown([]) }}>
                    {p.flag} {p.name} <span className="dd-club">{p.club}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn-primary green" onClick={submitGuess} style={{ marginTop: 8 }}>Submit Guess</button>
        </div>
      </Screen>
    )
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (gs.phase === 'results') {
    const r1 = gs.result_p1
    const r2 = gs.result_p2
    const headline = r1 && r2 ? '🏆 Both got it — Draw!' : r1 ? `🏆 ${p1Name} wins!` : r2 ? `🏆 ${p2Name} wins!` : "Nobody got it!"

    async function playAgain() {
      await supabase.from('rooms').update({ game_state: { phase: 'picking' }, status: 'active' }).eq('id', room.id)
    }

    return (
      <Screen>
        <div className="results-headline">{headline}</div>
        <div className="result-card">
          <div className="result-label">{p1Name} picked</div>
          <div className="result-player">{gs.pick_p1?.name}</div>
          <div className="result-info">{gs.pick_p1?.flag} {gs.pick_p1?.nation} · {gs.pick_p1?.club}</div>
          <div className={`result-badge ${r2 ? 'correct' : 'wrong'}`}>{r2 ? `${p2Name} guessed it 🎯` : `${p2Name} missed`}</div>
        </div>
        <div className="vs-line">VS</div>
        <div className="result-card">
          <div className="result-label">{p2Name} picked</div>
          <div className="result-player">{gs.pick_p2?.name}</div>
          <div className="result-info">{gs.pick_p2?.flag} {gs.pick_p2?.nation} · {gs.pick_p2?.club}</div>
          <div className={`result-badge ${r1 ? 'correct' : 'wrong'}`}>{r1 ? `${p1Name} guessed it 🎯` : `${p1Name} missed`}</div>
        </div>
        <button className="btn-primary" onClick={playAgain} style={{ marginTop: 16 }}>Play Again</button>
        <button className="btn-secondary" onClick={onLeave} style={{ marginTop: 8 }}>Back to Lobby</button>
      </Screen>
    )
  }

  return <Screen><div className="waiting-center"><div className="wait-title">Syncing... ({gs.phase})</div></div></Screen>
}

function Screen({ children }) {
  return <div className="game-screen">{children}</div>
}
