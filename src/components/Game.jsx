import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import PlayerPicker from './PlayerPicker'
import ClueEntry from './ClueEntry'
import { autoAnswer } from '../lib/autoAnswer'
import { PLAYERS } from '../data/players'

const TIMER_MS = 5 * 60 * 1000

export default function Game({ room, playerId, playerName, onLeave }) {
  const [gs, setGs] = useState(room.game_state)
  const [timerDisplay, setTimerDisplay] = useState('5:00')
  const [guessInput, setGuessInput] = useState('')
  const [dropdown, setDropdown] = useState([])
  const [qInput, setQInput] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    const channel = supabase
      .channel(`game-${room.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, payload => {
        setGs(payload.new.game_state)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function patch(updates) {
    const { data } = await supabase.from('rooms').select('game_state').eq('id', room.id).single()
    const merged = { ...(data?.game_state || {}), ...updates }
    await supabase.from('rooms').update({ game_state: merged }).eq('id', room.id)
    setGs(merged)
    return merged
  }

  // Timer for guessing phase
  useEffect(() => {
    clearInterval(timerRef.current)
    if (!gs?.timer_end || gs?.phase !== 'guessing') return
    const tick = () => {
      const left = Math.max(0, Math.round((gs.timer_end - Date.now()) / 1000))
      const m = Math.floor(left / 60)
      const s = left % 60
      setTimerDisplay(`${m}:${s.toString().padStart(2, '0')}`)
      if (left <= 0) { clearInterval(timerRef.current); handleTimerEnd() }
    }
    tick()
    timerRef.current = setInterval(tick, 500)
    return () => clearInterval(timerRef.current)
  }, [gs?.timer_end, gs?.phase])

  async function handleTimerEnd() {
    const { data } = await supabase.from('rooms').select('game_state').eq('id', room.id).single()
    const fresh = data?.game_state || {}
    if (fresh.phase !== 'guessing') return
    // Time's up — give points to clue giver if nobody got it
    const players = fresh.players || []
    const guesses = fresh.guesses || {}
    const anyCorrect = Object.values(guesses).some(g => g.correct)
    let newScores = { ...fresh.scores }
    if (!anyCorrect) {
      newScores[fresh.clue_giver] = (newScores[fresh.clue_giver] || 0) + 4
    }
    await advanceRound(fresh, newScores)
  }

  async function advanceRound(currentGs, newScores) {
    const players = currentGs.players
    const nextIdx = (currentGs.round_clue_giver_idx || 0) + 1
    if (nextIdx >= players.length) {
      // Game over
      await supabase.from('rooms').update({
        game_state: { ...currentGs, phase: 'game_over', scores: newScores }
      }).eq('id', room.id)
    } else {
      // Next round
      const nextCgId = currentGs.clue_giver_order[nextIdx]
      await supabase.from('rooms').update({
        game_state: {
          ...currentGs,
          phase: 'picking',
          round: (currentGs.round || 1) + 1,
          clue_giver: nextCgId,
          round_clue_giver_idx: nextIdx,
          scores: newScores,
          picked_player: null,
          clues: null,
          guesses: {},
          questions: {},
        }
      }).eq('id', room.id)
    }
  }

  if (!gs) return <Screen><Center><div className="wait-title">Loading...</div></Center></Screen>

  const players = gs.players || []
  const myPlayer = players.find(p => p.id === playerId)
  const isClueGiver = gs.clue_giver === playerId
  const clueGiverPlayer = players.find(p => p.id === gs.clue_giver)
  const clueGiverName = clueGiverPlayer?.name || 'Someone'

  // ── PICKING ──────────────────────────────────────────────────────────────
  if (gs.phase === 'picking') {
    if (!isClueGiver) {
      return (
        <Screen>
          <Center>
            <div className="big-emoji">👀</div>
            <div className="wait-title">{clueGiverName} is picking a player...</div>
            <div className="wait-sub">Get ready to guess!</div>
            <Scores players={players} scores={gs.scores} round={gs.round} total={gs.total_rounds} />
          </Center>
        </Screen>
      )
    }
    return (
      <Screen>
        <PlayerPicker playerName={playerName} onConfirm={async (player) => {
          await patch({ picked_player: player, phase: 'writing_clues', clues: null })
        }} />
      </Screen>
    )
  }

  // ── WRITING CLUES ────────────────────────────────────────────────────────
  if (gs.phase === 'writing_clues') {
    if (!isClueGiver) {
      return (
        <Screen>
          <Center>
            <div className="big-emoji">✍️</div>
            <div className="wait-title">{clueGiverName} is writing clues...</div>
            <div className="wait-sub">Sit tight — get ready to guess!</div>
            <Scores players={players} scores={gs.scores} round={gs.round} total={gs.total_rounds} />
          </Center>
        </Screen>
      )
    }
    return (
      <Screen>
        <ClueEntry
          playerName={playerName}
          player={gs.picked_player}
          showTimer={false}
          onSubmit={async (clues) => {
            await patch({ clues, phase: 'guessing', timer_end: Date.now() + TIMER_MS, guesses: {}, questions: {} })
          }}
        />
      </Screen>
    )
  }

  // ── GUESSING ─────────────────────────────────────────────────────────────
  if (gs.phase === 'guessing') {
    const clues = gs.clues || []
    const myGuessData = (gs.guesses || {})[playerId] || { guesses_left: 2, correct: false, done: false, questions_left: 3, questions_used: 0 }
    const myQuestions = (gs.questions || {})[playerId] || []
    const timerSecs = Math.max(0, Math.round(((gs.timer_end || 0) - Date.now()) / 1000))

    if (isClueGiver) {
      const guesses = gs.guesses || {}
      const guessers = players.filter(p => p.id !== playerId)
      const doneCount = guessers.filter(p => guesses[p.id]?.done).length
      return (
        <Screen>
          <div className="phase-header">
            <div className="phase-label">You gave the clues</div>
            <div className="phase-title">Guessers are playing...</div>
          </div>
          <div className="timer-bar">
            <span className="timer-label">Time left</span>
            <span className={`timer-val ${timerSecs < 60 ? 'danger' : timerSecs < 120 ? 'warning' : ''}`}>{timerDisplay}</span>
          </div>
          <div className="clues-reveal">
            <div className="section-label">Your clues</div>
            {clues.map((c, i) => <div key={i} className="clue-card revealed"><span>💡</span><span className="clue-text">{c}</span></div>)}
          </div>
          <div className="section">
            <div className="section-label">Guessers ({doneCount}/{guessers.length} done)</div>
            {guessers.map(p => {
              const g = guesses[p.id]
              return (
                <div key={p.id} className="qa-row">
                  <span>{p.name}</span>
                  <span className={g?.correct ? 'yes' : g?.done ? 'no' : ''}>{g?.correct ? '✅ Got it!' : g?.done ? '❌ Missed' : '⏳ Guessing...'}</span>
                </div>
              )
            })}
          </div>
          <div className="section">
            <div className="section-label">The player was</div>
            <div className="result-player" style={{textAlign:'center'}}>{gs.picked_player?.flag} {gs.picked_player?.name}</div>
          </div>
        </Screen>
      )
    }

    if (myGuessData.done) {
      return (
        <Screen>
          <Center>
            <div className="big-emoji">{myGuessData.correct ? '🎯' : '😔'}</div>
            <div className="wait-title">{myGuessData.correct ? 'You got it!' : 'Better luck next round!'}</div>
            <div className="wait-sub">Waiting for others to finish...</div>
            <div className="timer-bar" style={{marginTop:16}}>
              <span className="timer-label">Time left</span>
              <span className={`timer-val ${timerSecs < 60 ? 'danger' : timerSecs < 120 ? 'warning' : ''}`}>{timerDisplay}</span>
            </div>
          </Center>
        </Screen>
      )
    }

    function handleGuessType(val) {
      setGuessInput(val)
      if (!val.trim()) { setDropdown([]); return }
      setDropdown(PLAYERS.filter(p => p.name.toLowerCase().includes(val.toLowerCase())).slice(0, 8))
    }

    async function askQuestion() {
      if (!qInput.trim() || myGuessData.questions_left <= 0) return
      const answer = autoAnswer(qInput.toLowerCase(), gs.picked_player)
      const newQs = [...myQuestions, { q: qInput, a: answer }]
      const newQLeft = myGuessData.questions_left - 1
      const newGuessData = { ...myGuessData, questions_left: newQLeft, questions_used: (myGuessData.questions_used || 0) + 1 }
      await patch({
        [`questions.${playerId}`]: newQs,
        guesses: { ...(gs.guesses || {}), [playerId]: newGuessData }
      })
      setQInput('')
    }

    async function submitGuess() {
      const val = guessInput.trim().toLowerCase()
      if (!val || myGuessData.guesses_left <= 0) return
      const correct = gs.picked_player.name.toLowerCase() === val
      const guessesLeft = myGuessData.guesses_left - 1
      const questionsUsed = myGuessData.questions_used || 0

      let points = 0
      if (correct) {
        if (myGuessData.guesses_left === 2 && questionsUsed === 0) points = 5 // first guess no questions
        else if (myGuessData.guesses_left === 2) points = 5 // first guess
        else if (questionsUsed >= 3) points = 2 // correct but used all questions
        else points = 3 // second guess
      }

      const newGuessData = { ...myGuessData, guesses_left: guessesLeft, correct, done: correct || guessesLeft <= 0 }
      const newScores = correct ? { ...gs.scores, [playerId]: (gs.scores?.[playerId] || 0) + points } : gs.scores
      const newAllGuesses = { ...(gs.guesses || {}), [playerId]: newGuessData }

      // Check if all guessers are done
      const guessers = players.filter(p => p.id !== gs.clue_giver)
      const allDone = guessers.every(p => p.id === playerId ? newGuessData.done : newAllGuesses[p.id]?.done)

      if (allDone) {
        const anyCorrect = Object.values(newAllGuesses).some(g => g.correct)
        let finalScores = { ...newScores }
        if (!anyCorrect) finalScores[gs.clue_giver] = (finalScores[gs.clue_giver] || 0) + 4
        const { data } = await supabase.from('rooms').select('game_state').eq('id', room.id).single()
        await advanceRound({ ...(data?.game_state || {}), guesses: newAllGuesses, scores: finalScores }, finalScores)
      } else {
        await patch({ guesses: newAllGuesses, scores: newScores })
        setGuessInput('')
        setDropdown([])
      }
    }

    return (
      <Screen>
        <div className="phase-header">
          <div className="phase-label">Guess {clueGiverName}'s player</div>
          <div className="phase-title">Who is it?</div>
        </div>
        <div className="timer-bar">
          <span className="timer-label">Time</span>
          <span className={`timer-val ${timerSecs < 60 ? 'danger' : timerSecs < 120 ? 'warning' : ''}`}>{timerDisplay}</span>
        </div>
        <div className="section">
          <div className="section-label">Clues from {clueGiverName}</div>
          {clues.map((c, i) => <div key={i} className="clue-card revealed"><span>💡</span><span className="clue-text">{c}</span></div>)}
        </div>
        <div className="section">
          <div className="section-label">Your Yes/No Questions — {myGuessData.questions_left} left</div>
          {myQuestions.map((qa, i) => (
            <div key={i} className="qa-row">
              <span>{qa.q}</span>
              <span className={qa.a ? 'yes' : 'no'}>{qa.a ? 'YES ✅' : 'NO ❌'}</span>
            </div>
          ))}
          {myGuessData.questions_left > 0 && (
            <div className="q-row">
              <input className="q-input" value={qInput} onChange={e => setQInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && askQuestion()} placeholder="e.g. Is he French? Ever played for Real Madrid?" />
              <button className="btn-ask" onClick={askQuestion}>Ask</button>
            </div>
          )}
        </div>
        <div className="section">
          <div className="section-label">Your Guesses — {myGuessData.guesses_left} left</div>
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

  // ── GAME OVER ─────────────────────────────────────────────────────────────
  if (gs.phase === 'game_over') {
    const sorted = [...players].sort((a, b) => (gs.scores?.[b.id] || 0) - (gs.scores?.[a.id] || 0))
    const winner = sorted[0]
    return (
      <Screen>
        <div className="results-headline">🏆 Game Over!</div>
        <div className="result-card" style={{textAlign:'center',marginBottom:16}}>
          <div className="result-label">Winner</div>
          <div className="result-player">{winner.name}</div>
          <div className="result-badge correct">{gs.scores?.[winner.id] || 0} points</div>
        </div>
        <div className="section">
          <div className="section-label">Final Scores</div>
          {sorted.map((p, i) => (
            <div key={p.id} className="qa-row">
              <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} {p.name}</span>
              <span className="yes">{gs.scores?.[p.id] || 0} pts</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={onLeave} style={{ marginTop: 16 }}>Back to Lobby</button>
      </Screen>
    )
  }

  return <Screen><Center><div className="wait-title">Syncing... ({gs.phase})</div></Center></Screen>
}

function Screen({ children }) { return <div className="game-screen">{children}</div> }
function Center({ children }) { return <div className="waiting-center">{children}</div> }
function Scores({ players, scores, round, total }) {
  return (
    <div className="mini-scores">
      <div className="section-label" style={{marginBottom:6}}>Round {round}/{total} · Scores</div>
      {players.map(p => (
        <div key={p.id} className="qa-row">
          <span>{p.name}</span>
          <span className="yes">{scores?.[p.id] || 0} pts</span>
        </div>
      ))}
    </div>
  )
}
