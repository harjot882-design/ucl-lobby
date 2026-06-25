import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase.js'
import { autoAnswer } from '../lib/autoAnswer.js'
import { PLAYERS, ALL_NAMES } from '../data/players.js'
import Background from './Background.jsx'
import UCLHeader from './UCLHeader.jsx'
import PlayerPicker from './PlayerPicker.jsx'

// ── scoring constants ─────────────────────────────────────────────────────────
// Base points for guessing correctly: 1st=3pts, 2nd=2pts, 3rd=1pt
// Each question asked costs 0.5 points from potential winnings
// If nobody guesses: chooser gets 4 points

const BASE_POINTS = [3, 2, 1] // by order of correct guess

function calcGuesserPoints(guessOrder, questionsUsed) {
  if (guessOrder === null) return 0
  const base = BASE_POINTS[guessOrder] ?? 1
  const penalty = questionsUsed * 0.5
  return Math.max(0, base - penalty)
}

function fuzzy(inp, n) {
  const a = inp.toLowerCase().trim(), b = n.toLowerCase()
  if (!a || a.length < 2) return false
  return b.includes(a) || b.split(' ').some(p => p.startsWith(a))
}
function isCorrect(inp, name) {
  const a = inp.toLowerCase().trim(), b = name.toLowerCase()
  return b === a || (b.includes(a) && a.length >= 3) || b.split(' ').slice(-1)[0] === a
}

export default function Game({ session, onLeave }) {
  const { roomCode, playerSlot, playerName } = session
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [guess, setGuess] = useState('')
  const [dropItems, setDropItems] = useState([])
  const [dropIdx, setDropIdx] = useState(-1)
  const [clues, setClues] = useState(['','',''])
  const roomRef = useRef(null)

  // ── fetch + subscribe ──────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('rooms').select('*').eq('code', roomCode).single()
      if (data) { setRoom(data); roomRef.current = data }
      setLoading(false)
    }
    load()
    const ch = supabase.channel(`room-${roomCode}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'rooms', filter:`code=eq.${roomCode}` },
        p => { setRoom(p.new); roomRef.current = p.new })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [roomCode])

  async function upd(fields) {
    await supabase.from('rooms').update(fields).eq('code', roomCode)
  }

  // ── derived state ──────────────────────────────────────────────────────────
  const me = room?.players?.find(p => p.slot === playerSlot)
  const isChooser = me?.role === 'chooser'
  const isGuesser = me?.role === 'guesser'
  const secretPlayer = room?.secret_player ? PLAYERS.find(p => p.name === room.secret_player) : null
  const myGuesserData = room?.guesser_data?.[playerSlot] || { questions:[], guesses:0, correct:false, guessOrder:null }
  const qUsed = myGuesserData.questions?.length || 0
  const qLeft = 3 - qUsed
  const gLeft = 2 - (myGuesserData.guesses || 0)
  const iAlreadyGuessedRight = myGuesserData.correct

  // ── start game (when 2-4 players are in lobby, host can start) ────────────
  async function startGame() {
    const r = roomRef.current
    const players = r.players || []
    if (players.length < 2) return
    // Randomly assign chooser
    const chooserIdx = Math.floor(Math.random() * players.length)
    const updated = players.map((p, i) => ({
      ...p,
      role: i === chooserIdx ? 'chooser' : 'guesser'
    }))
    await upd({ phase: 'picking', players: updated, chooser_slot: updated[chooserIdx].slot, guesser_data: {} })
  }

  // ── chooser picks secret player ───────────────────────────────────────────
  async function pickSecretPlayer(player) {
    await upd({ secret_player: player.name, phase: 'writing_clues' })
  }

  // ── chooser locks clues ───────────────────────────────────────────────────
  async function lockClues() {
    if (clues.filter(c => c.trim()).length < 3) { alert('Fill in all 3 clues!'); return }
    // Init guesser_data for each guesser
    const r = roomRef.current
    const guessers = (r.players || []).filter(p => p.role === 'guesser')
    const gdata = {}
    guessers.forEach(g => { gdata[g.slot] = { questions:[], guesses:0, correct:false, guessOrder:null } })
    await upd({ clues, phase: 'guessing', guesser_data: gdata })
  }

  // ── guesser asks a question ───────────────────────────────────────────────
  async function askQuestion() {
    if (!question.trim() || !secretPlayer || qLeft <= 0) return
    const ans = autoAnswer(question.trim(), secretPlayer)
    const ansText = ans === null ? '❓ Try rephrasing' : ans ? 'Yes' : 'No'
    const newQ = { q: question.trim(), a: ansText }
    const r = roomRef.current
    const updated = {
      ...r.guesser_data,
      [playerSlot]: {
        ...myGuesserData,
        questions: [...(myGuesserData.questions || []), newQ]
      }
    }
    await upd({ guesser_data: updated })
    setQuestion('')
  }

  // ── guesser makes a guess ─────────────────────────────────────────────────
  async function makeGuess() {
    if (!guess.trim() || !secretPlayer) return
    const r = roomRef.current
    const correct = isCorrect(guess.trim(), secretPlayer.name)
    const newGuesses = (myGuesserData.guesses || 0) + 1

    // Count how many correct guesses before this one
    const gdata = r.guesser_data || {}
    const correctSoFar = Object.values(gdata).filter(g => g.correct).length
    const guessOrder = correct ? correctSoFar : null

    // Calculate points if correct
    let newScores = { ...(r.scores || {}) }
    if (correct) {
      const pts = calcGuesserPoints(correctSoFar, myGuesserData.questions?.length || 0)
      newScores[playerSlot] = (parseFloat(newScores[playerSlot]) || 0) + pts
    }

    const updatedGdata = {
      ...gdata,
      [playerSlot]: {
        ...myGuesserData,
        guesses: newGuesses,
        correct,
        guessOrder: correct ? correctSoFar : null,
      }
    }

    // Check if game should end: all guessers have either guessed correctly or used up guesses
    const guessers = (r.players || []).filter(p => p.role === 'guesser')
    const allDone = guessers.every(g => {
      const gd = g.slot === playerSlot ? updatedGdata[playerSlot] : gdata[g.slot]
      return gd?.correct || (gd?.guesses || 0) >= 2
    })

    const anyCorrect = guessers.some(g => {
      const gd = g.slot === playerSlot ? updatedGdata[playerSlot] : gdata[g.slot]
      return gd?.correct
    })

    let updates = { guesser_data: updatedGdata, scores: newScores }
    if (allDone) {
      // If nobody got it, give chooser 4 points
      if (!anyCorrect) {
        const chooserSlot = r.chooser_slot
        newScores[chooserSlot] = (parseFloat(newScores[chooserSlot]) || 0) + 4
        updates.scores = newScores
      }
      updates.phase = 'reveal'
    }

    await upd(updates)
    setGuess('')
    setDropItems([])
  }

  // ── play again (reset for next round) ────────────────────────────────────
  async function playAgain() {
    const r = roomRef.current
    // Rotate chooser to next player
    const players = r.players || []
    const currentChooserIdx = players.findIndex(p => p.slot === r.chooser_slot)
    const nextChooserIdx = (currentChooserIdx + 1) % players.length
    const updated = players.map((p, i) => ({ ...p, role: i === nextChooserIdx ? 'chooser' : 'guesser' }))
    await upd({
      phase: 'picking',
      players: updated,
      chooser_slot: updated[nextChooserIdx].slot,
      secret_player: null,
      clues: null,
      guesser_data: {},
    })
    setClues(['','',''])
  }

  // ── guess dropdown ────────────────────────────────────────────────────────
  function handleGuessInput(val) {
    setGuess(val)
    setDropItems(val.length >= 2 ? ALL_NAMES.filter(n => fuzzy(val, n)).slice(0, 6) : [])
    setDropIdx(-1)
  }
  function handleGuessKey(e) {
    if (e.key === 'ArrowDown') { setDropIdx(i => Math.min(i+1, dropItems.length-1)); e.preventDefault() }
    else if (e.key === 'ArrowUp') { setDropIdx(i => Math.max(i-1, -1)); e.preventDefault() }
    else if (e.key === 'Enter') {
      if (dropIdx >= 0 && dropItems[dropIdx]) { setGuess(dropItems[dropIdx]); setDropItems([]); setDropIdx(-1) }
      else makeGuess()
    }
  }

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="shell"><Background/>
      <div className="content" style={{textAlign:'center',padding:60}}>
        <span className="spin" style={{width:24,height:24,borderWidth:3}}/>
        <div style={{color:'var(--silver)',marginTop:12,fontSize:13}}>Connecting...</div>
      </div>
    </div>
  )
  if (!room) return (
    <div className="shell"><Background/>
      <div className="content" style={{textAlign:'center',padding:60}}>
        <div style={{color:'#fca5a5',fontSize:14}}>Room not found</div>
        <button className="btn btn-ghost" style={{marginTop:16}} onClick={onLeave}>← Back</button>
      </div>
    </div>
  )

  const players = room.players || []
  const guessers = players.filter(p => p.role === 'guesser')
  const chooser = players.find(p => p.role === 'chooser')
  const phase = room.phase
  const scores = room.scores || {}

  function renderBody() {

    // ── WAITING FOR PLAYERS ──
    if (phase === 'waiting') {
      const isHost = playerSlot === 1
      return (
        <div style={{maxWidth:400,margin:'0 auto'}}>
          <div style={{background:'rgba(77,166,255,.07)',border:'1px solid rgba(77,166,255,.25)',borderRadius:12,padding:20,textAlign:'center',marginBottom:16}}>
            <div style={{fontSize:11,color:'var(--silver)',marginBottom:8,letterSpacing:'.1em',textTransform:'uppercase'}}>Room code</div>
            <div className="code-big">{roomCode}</div>
            <button className="btn btn-ghost" style={{marginTop:10,fontSize:11}} onClick={()=>navigator.clipboard.writeText(roomCode)}>📋 Copy code</button>
          </div>

          <div style={{marginBottom:14}}>
            <div className="slbl">Players ({players.length}/4)</div>
            {players.map(p => (
              <div key={p.slot} className="player-slot">
                <div className="player-dot"/>
                <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                {p.slot === 1 && <span style={{fontSize:10,color:'rgba(77,166,255,.6)',marginLeft:'auto'}}>host</span>}
              </div>
            ))}
            {Array.from({length: 4 - players.length}).map((_,i) => (
              <div key={i} className="player-slot" style={{opacity:.3}}>
                <div className="player-dot" style={{background:'rgba(255,255,255,.2)'}}/>
                <div style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>Waiting for player...</div>
              </div>
            ))}
          </div>

          {isHost ? (
            <button className="btn btn-glow" style={{width:'100%',fontSize:13,padding:13}} onClick={startGame} disabled={players.length < 2}>
              {players.length < 2 ? 'Need at least 2 players' : `Start game (${players.length} players)`}
            </button>
          ) : (
            <div style={{textAlign:'center',fontSize:13,color:'var(--silver)'}} className="pulse">
              Waiting for host to start...
            </div>
          )}
        </div>
      )
    }

    // ── CHOOSER PICKS PLAYER ──
    if (phase === 'picking') {
      if (isChooser) {
        return (
          <div>
            <div className="warn">🎯 You are the <strong>Chooser</strong> this round — pick a secret player. The other players will try to guess who it is!</div>
            <PlayerPicker onPick={pickSecretPlayer}/>
          </div>
        )
      }
      return (
        <div style={{textAlign:'center',padding:'40px 20px'}}>
          <div style={{fontSize:28,marginBottom:12}}>🕵️</div>
          <div style={{fontSize:14,fontWeight:700,color:'var(--white)',marginBottom:8}}>{chooser?.name} is choosing a player...</div>
          <div style={{fontSize:12,color:'var(--silver)'}} className="pulse">Get ready to guess!</div>
        </div>
      )
    }

    // ── CHOOSER WRITES CLUES ──
    if (phase === 'writing_clues') {
      if (isChooser) {
        return (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:11,marginBottom:12,background:'rgba(255,255,255,.02)',border:'1px solid rgba(77,166,255,.1)',borderRadius:10,padding:'11px 13px'}}>
              {secretPlayer && <><div className="pav" style={{background:secretPlayer.col,width:44,height:44,fontSize:13}}>{secretPlayer.initials}</div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#fff'}}>{secretPlayer.name}</div>
                <div style={{fontSize:10,color:'var(--silver)',marginTop:2}}>{secretPlayer.club} · {secretPlayer.nat}</div>
              </div></>}
            </div>
            <div className="warn">✍️ Write 3 clues — no name, club or nationality! Make them cryptic but fair.</div>
            <div style={{marginBottom:12}}>
              {[0,1,2].map(i => (
                <div key={i} className="clue-row">
                  <div className="clue-n">{i+1}</div>
                  <input className="inp" placeholder={`Clue ${i+1}...`} value={clues[i]} onChange={e=>{const n=[...clues];n[i]=e.target.value;setClues(n)}} style={{flex:1}}/>
                </div>
              ))}
            </div>
            <button className="btn btn-glow" style={{width:'100%'}} onClick={lockClues}>
              🔒 Reveal clues to guessers
            </button>
          </div>
        )
      }
      return (
        <div style={{textAlign:'center',padding:'40px 20px'}}>
          <div style={{fontSize:28,marginBottom:12}}>✍️</div>
          <div style={{fontSize:14,fontWeight:700,color:'var(--white)',marginBottom:8}}>{chooser?.name} is writing clues...</div>
          <div style={{fontSize:12,color:'var(--silver)'}} className="pulse">Clues will appear here shortly</div>
        </div>
      )
    }

    // ── GUESSING PHASE ──
    if (phase === 'guessing') {
      const gdata = room.guesser_data || {}

      // Show chooser the live guessing status
      if (isChooser) {
        return (
          <div>
            <div style={{background:'rgba(245,200,66,.07)',border:'1px solid rgba(245,200,66,.2)',borderRadius:10,padding:'10px 14px',marginBottom:14,textAlign:'center'}}>
              <div style={{fontSize:11,color:'#f5c842',fontWeight:700,marginBottom:4}}>Your player: {secretPlayer?.name}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,.4)'}}>Watch the guessers try to figure it out!</div>
            </div>

            <div className="slbl">Clues you gave</div>
            {(room.clues||[]).map((c,i) => (
              <div key={i} className="clue-row"><div className="clue-n">{i+1}</div><span style={{fontSize:13}}>{c}</span></div>
            ))}

            <div className="slbl" style={{marginTop:14}}>Guesser status</div>
            {guessers.map(g => {
              const gd = gdata[g.slot] || {}
              return (
                <div key={g.slot} className={`guesser-panel${gd.correct?' correct':''}`}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                    <div style={{fontSize:13,fontWeight:700}}>{g.name}</div>
                    <div style={{fontSize:12,color:gd.correct?'#6ee7b7':'rgba(255,255,255,.4)'}}>
                      {gd.correct ? '✓ Got it!' : `${3-(gd.questions?.length||0)} questions left · ${2-(gd.guesses||0)} guesses left`}
                    </div>
                  </div>
                  {(gd.questions||[]).map((q,i) => (
                    <div key={i} className={`qi ${q.a==='Yes'?'qi-yes':q.a==='No'?'qi-no':'qi-unk'}`}>
                      <span className={`qbadge ${q.a==='Yes'?'qb-yes':q.a==='No'?'qb-no':'qb-unk'}`}>{q.a==='Yes'?'YES':q.a==='No'?'NO':'?'}</span>
                      <span className="qtext">{q.q}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )
      }

      // Guesser view
      return (
        <div>
          {/* Clues */}
          <div className="card card-glow" style={{marginBottom:9}}>
            <div className="slbl">Clues from {chooser?.name}</div>
            {(room.clues||[]).map((c,i) => (
              <div key={i} className="clue-row"><div className="clue-n">{i+1}</div><span style={{fontSize:13,color:'var(--white)'}}>{c}</span></div>
            ))}
          </div>

          {iAlreadyGuessedRight ? (
            <div style={{textAlign:'center',padding:'20px',background:'rgba(52,211,153,.06)',border:'1px solid rgba(52,211,153,.2)',borderRadius:12}}>
              <div style={{fontSize:24,marginBottom:8}}>🎉</div>
              <div style={{fontSize:14,fontWeight:700,color:'#6ee7b7'}}>You got it!</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:4}}>Waiting for other players to finish...</div>
            </div>
          ) : (
            <>
              {/* Questions */}
              <div className="card" style={{marginBottom:9}}>
                <div className="slbl">Ask a question <span style={{fontSize:9,color:'rgba(255,255,255,.2)'}}>{qLeft} left</span></div>
                <div style={{fontSize:10,color:'rgba(77,166,255,.5)',marginBottom:8}}>⚡ Auto-answered instantly · each question costs -0.5 pts</div>
                {(myGuesserData.questions||[]).map((q,i) => {
                  const isYes=q.a==='Yes',isNo=q.a==='No'
                  return (
                    <div key={i} className={`qi ${isYes?'qi-yes':isNo?'qi-no':'qi-unk'}`}>
                      <span className={`qbadge ${isYes?'qb-yes':isNo?'qb-no':'qb-unk'}`}>{isYes?'YES':isNo?'NO':'?'}</span>
                      <span className="qtext">{q.q}</span>
                    </div>
                  )
                })}
                {qLeft > 0 ? (
                  <>
                    <div style={{display:'flex',gap:8,marginTop:9}}>
                      <input className="inp" placeholder="e.g. Is he a forward? Left-footed?" value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askQuestion()} style={{flex:1}}/>
                      <button className="btn btn-blue" onClick={askQuestion}>Ask</button>
                    </div>
                    <div className="hint">Try: position · foot · UCL wins · nationality · league · born after/before YEAR · ever played for [club]</div>
                  </>
                ) : (
                  <div style={{textAlign:'center',fontSize:9,color:'rgba(255,255,255,.2)',textTransform:'uppercase',letterSpacing:'.1em',padding:'5px 0'}}>No questions left</div>
                )}
              </div>

              {/* Guess */}
              <div className="card" style={{marginBottom:11}}>
                <div className="slbl">Your guess <span style={{fontSize:9,color:'rgba(255,255,255,.2)'}}>{gLeft} left</span></div>
                {(myGuesserData.guesses||0) > 0 && !iAlreadyGuessedRight && (
                  <div style={{fontSize:11,fontWeight:700,color:'#f87171',marginBottom:7}}>✗ Wrong — {gLeft} guess{gLeft===1?'':'es'} left</div>
                )}
                <div style={{display:'flex',gap:8}}>
                  <div className="drop-wrap">
                    <input className="inp" placeholder="Type a player name..." value={guess} onChange={e=>handleGuessInput(e.target.value)} onKeyDown={handleGuessKey} autoComplete="off"/>
                    {dropItems.length > 0 && (
                      <div className="ddrop">
                        {dropItems.map((n,i)=>(
                          <div key={n} className={`di${i===dropIdx?' act':''}`} onMouseDown={()=>{setGuess(n);setDropItems([])}}>  {n}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn btn-glow" onClick={makeGuess}>Guess</button>
                </div>
              </div>

              {/* Other guessers status */}
              <div style={{fontSize:10,color:'rgba(255,255,255,.3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.08em'}}>Other guessers</div>
              {guessers.filter(g=>g.slot!==playerSlot).map(g=>{
                const gd=gdata[g.slot]||{}
                return <div key={g.slot} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:12,color:'rgba(255,255,255,.5)',marginBottom:5}}>
                  <span>{g.name}</span>
                  <span style={{color:gd.correct?'#6ee7b7':'rgba(255,255,255,.3)'}}>{gd.correct?'✓ Got it!':'Still guessing...'}</span>
                </div>
              })}
            </>
          )}
        </div>
      )
    }

    // ── REVEAL ──
    if (phase === 'reveal') {
      const gdata = room.guesser_data || {}
      const anyCorrect = guessers.some(g => gdata[g.slot]?.correct)

      return (
        <div>
          <div style={{textAlign:'center',marginBottom:18}}>
            <div style={{fontSize:22,fontWeight:900,color:'#fff',letterSpacing:'.04em'}}>
              {anyCorrect ? '🏆 Round over!' : `😅 Nobody got it!`}
            </div>
            {!anyCorrect && chooser && (
              <div style={{fontSize:13,color:'#f5c842',marginTop:6}}>+4 points for {chooser.name}!</div>
            )}
          </div>

          {/* Secret player reveal */}
          {secretPlayer && (
            <div className="card card-glow" style={{textAlign:'center',marginBottom:14}}>
              <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginBottom:8,letterSpacing:'.1em',textTransform:'uppercase'}}>The player was</div>
              <div style={{display:'flex',alignItems:'center',gap:12,justifyContent:'center'}}>
                <div className="pav" style={{background:secretPlayer.col,width:50,height:50,fontSize:15}}>{secretPlayer.initials}</div>
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:18,fontWeight:900,color:'#fff'}}>{secretPlayer.name}</div>
                  <div style={{fontSize:12,color:'var(--silver)'}}>{secretPlayer.club} · {secretPlayer.nat}</div>
                </div>
              </div>
            </div>
          )}

          {/* Scores this round */}
          <div className="slbl">Round results</div>
          {guessers.map(g => {
            const gd = gdata[g.slot] || {}
            const pts = gd.correct ? calcGuesserPoints(gd.guessOrder, gd.questions?.length||0) : 0
            return (
              <div key={g.slot} className={`rev-card ${gd.correct?'rev-win':'rev-lose'}`} style={{marginBottom:8}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{g.name}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>
                      {gd.correct
                        ? `${gd.guessOrder===0?'1st':gd.guessOrder===1?'2nd':'3rd'} to guess · ${gd.questions?.length||0} questions used`
                        : 'Did not guess correctly'}
                    </div>
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:gd.correct?'#6ee7b7':'#f87171'}}>
                    {gd.correct ? `+${pts}` : '+0'}
                  </div>
                </div>
              </div>
            )
          })}
          {/* Chooser result */}
          {chooser && !anyCorrect && (
            <div className="rev-card rev-win" style={{marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{chooser.name} <span className="role-badge role-chooser">chooser</span></div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>Nobody guessed — bonus!</div>
                </div>
                <div style={{fontSize:20,fontWeight:800,color:'#6ee7b7'}}>+4</div>
              </div>
            </div>
          )}

          {/* Total scoreboard */}
          <div className="slbl" style={{marginTop:14}}>Total scores</div>
          {[...players].sort((a,b)=>(parseFloat(scores[b.slot])||0)-(parseFloat(scores[a.slot])||0)).map((p,i) => (
            <div key={p.slot} className="score-row">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:16,width:24,textAlign:'center',color:'rgba(255,255,255,.3)',fontWeight:800}}>{i+1}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{p.name}</div>
                  <span className={`role-badge ${p.role==='chooser'?'role-chooser':'role-guesser'}`}>{p.role}</span>
                </div>
              </div>
              <div className="score-pts">{parseFloat(scores[p.slot]||0).toFixed(1)}</div>
            </div>
          ))}

          {playerSlot === 1 && (
            <button className="btn btn-glow" style={{width:'100%',marginTop:14,fontSize:13,padding:13}} onClick={playAgain}>
              ↺ Next round
            </button>
          )}
          {playerSlot !== 1 && (
            <div style={{textAlign:'center',fontSize:13,color:'var(--silver)',marginTop:14}} className="pulse">
              Waiting for host to start next round...
            </div>
          )}
        </div>
      )
    }

    return (
      <div style={{textAlign:'center',padding:40,color:'var(--silver)',fontSize:13}} className="pulse">
        Loading...
      </div>
    )
  }

  return (
    <div className="shell">
      <Background/>
      <div className="content">
        <UCLHeader/>
        <div className="sbar">
          <div className="spill">
            {players.map((p,i) => (
              <span key={p.slot} style={{color:p.slot===playerSlot?'var(--glow)':'rgba(255,255,255,.5)'}}>
                {i>0?' · ':''}{p.name}
              </span>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {me && <span className={`role-badge ${me.role==='chooser'?'role-chooser':me.role==='guesser'?'role-guesser':''}`}>{me.role||'lobby'}</span>}
            <span style={{fontSize:11,color:'var(--silver)',fontWeight:600}}>{roomCode}</span>
            <button className="btn btn-ghost" style={{fontSize:10,padding:'4px 10px'}} onClick={onLeave}>Leave</button>
          </div>
        </div>
        <div className="pad">{renderBody()}</div>
      </div>
    </div>
  )
}
