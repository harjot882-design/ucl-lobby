import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import PlayerPicker from "./PlayerPicker";

const POINTS = { firstGuess: 5, secondGuess: 3, allQuestions: 2, noGuess: 4, wrong: 0 };
const QUESTION_TIMER = 5 * 60;

async function getAIAnswer(playerName, question) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 50,
        system: `You are a football expert answering yes/no questions about players. Answer ONLY with "Yes" or "No" — nothing else. Be accurate about the player's club, nationality, position, age, and career facts as of the 2024/25 season.`,
        messages: [{ role: "user", content: `The secret player is: ${playerName}\nQuestion: ${question}\nAnswer with only Yes or No:` }]
      })
    });
    const data = await response.json();
    const text = data?.content?.[0]?.text?.trim() ?? "";
    if (text.toLowerCase().startsWith("yes")) return "Yes";
    if (text.toLowerCase().startsWith("no")) return "No";
    return "Unknown";
  } catch (err) {
    console.error("AI answer error:", err);
    return "Unknown";
  }
}

export default function Game({ roomId, playerId, playerName }) {
  const [gs, setGs] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [clues, setClues] = useState(["", "", ""]);
  const [guessInput, setGuessInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER);
  const [guessResult, setGuessResult] = useState(null);
  const [myQuestions, setMyQuestions] = useState([]);
  const [questionInput, setQuestionInput] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchGs = async () => {
      const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
      if (data?.game_state) setGs(data.game_state);
    };
    fetchGs();
    const channel = supabase.channel(`room-${roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => { if (payload.new?.game_state) setGs(payload.new.game_state); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [roomId]);

  useEffect(() => {
    if (gs?.phase !== "guessing") return;
    if (gs.clueGiver === playerId) return;
    clearInterval(timerRef.current);
    setTimeLeft(QUESTION_TIMER);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gs?.phase, gs?.clueGiver, playerId]);

  useEffect(() => {
    setMyQuestions([]);
    setGuessResult(null);
    setGuessInput("");
    setQuestionInput("");
    setSelectedPlayer("");
    setClues(["", "", ""]);
  }, [gs?.round]);

  if (!gs) return <div className="waiting-center"><div className="wait-title">Loading…</div></div>;

  const players = gs.players || {};
  const isGiver = gs.clueGiver === playerId;
  const secretPlayer = gs.secretPlayer;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  async function patch(updates) {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const merged = deepMerge(current, updates);
    await supabase.from("rooms").update({ game_state: merged }).eq("id", roomId);
  }

  function deepMerge(base, update) {
    const result = { ...base };
    for (const key of Object.keys(update)) {
      if (update[key] && typeof update[key] === "object" && !Array.isArray(update[key]) && base[key] && typeof base[key] === "object") {
        result[key] = deepMerge(base[key], update[key]);
      } else { result[key] = update[key]; }
    }
    return result;
  }

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (gs.phase === "lobby") {
    const isHost = gs.hostId === playerId;
    const playerList = Object.values(players);
    return (
      <div className="game-screen">
        <div className="waiting-center">
          <div className="big-emoji">🏆</div>
          <div className="room-code-display">
            <div className="rcd-label">Room Code</div>
            <div className="rcd-code">{roomId}</div>
          </div>
          <div className="card" style={{ width: "100%", marginTop: 12 }}>
            <div className="pl-label">Players ({playerList.length}/4)</div>
            {playerList.map(p => (
              <div key={p.id} className="pl-row">
                <span className="pl-dot">●</span>
                <span className="pl-name">{p.name}</span>
                {p.id === gs.hostId && <span className="pl-crown">👑 Host</span>}
              </div>
            ))}
            {isHost ? (
              playerList.length < 2
                ? <p className="hint" style={{ marginTop: 12 }}>Waiting for at least 2 players…</p>
                : <button className="btn-primary" style={{ marginTop: 14 }} onClick={startGame}>▶ Start Game ({playerList.length} players)</button>
            ) : (
              <p className="hint" style={{ marginTop: 12 }}>Waiting for host to start…</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── PICK PLAYER ───────────────────────────────────────────────────────────
  if (gs.phase === "pick_player") {
    if (!isGiver) {
      return (
        <div className="game-screen">
          <div className="waiting-center">
            <div className="big-emoji">⏳</div>
            <div className="wait-title">Stand by…</div>
            <div className="wait-sub"><strong>{players[gs.clueGiver]?.name}</strong> is choosing a player</div>
            <Scoreboard scores={gs.scores} players={players} />
          </div>
        </div>
      );
    }
    return (
      <div className="game-screen">
        <div className="phase-header">
          <div className="phase-label">Round {gs.round}</div>
          <div className="phase-title">🎯 You're the Clue Giver!</div>
        </div>
        <div className="look-away-banner">🙈 Ask others to look away while you pick</div>
        <div className="card">
          {!selectedPlayer ? (
            <PlayerPicker onSelect={(p) => setSelectedPlayer(p)} />
          ) : (
            <>
              <div className="picker-selected-banner">
                <span>✅ Selected: <strong>{selectedPlayer}</strong></span>
                <button className="picker-change-btn" onClick={() => setSelectedPlayer("")}>Change</button>
              </div>
              <div className="phase-label" style={{ marginBottom: 10 }}>Write 3 clues — be creative!</div>
              <div className="clue-list">
                {clues.map((c, i) => (
                  <div key={i} className="clue-row">
                    <span className="clue-num">{i + 1}</span>
                    <input className="clue-input" placeholder={`Clue ${i + 1}…`} value={c}
                      onChange={e => setClues(prev => prev.map((v, j) => j === i ? e.target.value : v))} />
                  </div>
                ))}
              </div>
              <button className="btn-primary" style={{ marginTop: 14 }}
                disabled={clues.some(c => !c.trim())}
                onClick={() => submitClues(selectedPlayer, clues)}>
                Lock Clues →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── GUESSING ──────────────────────────────────────────────────────────────
  if (gs.phase === "guessing") {
    const clueList = gs.clues || [];
    const myGuessesLeft = gs.guessesLeft?.[playerId] ?? 2;
    const questionsLeft = 3 - myQuestions.length;
    const timeUp = timeLeft === 0;

    if (isGiver) {
      const allGuessers = Object.values(players).filter(p => p.id !== gs.clueGiver);
      const finished = allGuessers.every(p => gs.guessersDone?.[p.id]);
      return (
        <div className="game-screen">
          <div className="phase-header">
            <div className="phase-label">Round {gs.round}</div>
            <div className="phase-title">🕵️ Guessers are playing…</div>
          </div>
          <div className="card">
            <div className="picked-badge" style={{ textAlign: "center", marginBottom: 12 }}>
              Your player: <strong>{secretPlayer}</strong>
            </div>
            <div className="section-label">Your clues</div>
            {clueList.map((c, i) => (
              <div key={i} className="clue-card revealed">
                <span style={{ color: "#4da6ff", fontWeight: 700, marginRight: 8 }}>{i + 1}</span>
                <span className="clue-text">{c}</span>
              </div>
            ))}
            <div className="section-label" style={{ marginTop: 14 }}>Guesser status</div>
            {allGuessers.map(p => (
              <div key={p.id} className="qa-row">
                <span>{p.name}</span>
                <span>{gs.guessersDone?.[p.id]
                  ? (gs.correctGuessers?.[p.id] ? <span className="yes">✅ Got it!</span> : <span className="no">❌ Missed</span>)
                  : "⏳ Guessing…"}</span>
              </div>
            ))}
            {finished && (
              <button className="btn-primary" style={{ marginTop: 14 }} onClick={endRound}>See Results →</button>
            )}
          </div>
        </div>
      );
    }

    const done = gs.guessersDone?.[playerId];
    if (done) {
      const correct = gs.correctGuessers?.[playerId];
      return (
        <div className="game-screen">
          <div className="waiting-center">
            <div className="big-emoji">{correct ? "✅" : "❌"}</div>
            <div className="wait-title">{correct ? "Correct!" : "Didn't get it!"}</div>
            {!correct && <div className="wait-sub">The player was <strong>{secretPlayer}</strong></div>}
            <div className="wait-sub" style={{ color: "#555" }}>Waiting for others…</div>
            <Scoreboard scores={gs.scores} players={players} />
          </div>
        </div>
      );
    }

    return (
      <div className="game-screen">
        <div className="phase-header">
          <div className="phase-label">Round {gs.round}</div>
          <div className="phase-title">🔍 Guess the Player!</div>
        </div>
        <div className="timer-bar">
          <span className="timer-label">Time left</span>
          <span className={`timer-val ${timeLeft < 60 ? "danger" : timeLeft < 120 ? "warning" : ""}`}>{fmt(timeLeft)}</span>
        </div>
        <div className="card">
          <div className="section-label">Clues</div>
          {clueList.map((c, i) => (
            <div key={i} className="clue-card revealed">
              <span style={{ color: "#4da6ff", fontWeight: 700, marginRight: 8 }}>{i + 1}</span>
              <span className="clue-text">{c}</span>
            </div>
          ))}
        </div>

        {myQuestions.length > 0 && (
          <div className="card" style={{ marginTop: 10 }}>
            <div className="section-label">Your Q&amp;A</div>
            {myQuestions.map((qa, i) => (
              <div key={i} className="qa-row">
                <span style={{ flex: 1 }}>Q{i + 1}: {qa.question}</span>
                <span className={qa.answer === "Yes" ? "yes" : "no"}>{qa.answer === "Yes" ? "✅ Yes" : "❌ No"}</span>
              </div>
            ))}
          </div>
        )}

        {!timeUp && questionsLeft > 0 && (
          <div className="card" style={{ marginTop: 10 }}>
            <div className="section-label">{questionsLeft} question{questionsLeft !== 1 ? "s" : ""} left</div>
            <div className="q-row">
              <input className="q-input" placeholder="Ask a yes/no question…"
                value={questionInput}
                onChange={e => setQuestionInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !askingQuestion && askQuestion()} />
              <button className="btn-ask" disabled={!questionInput.trim() || askingQuestion} onClick={askQuestion}>
                {askingQuestion ? "…" : "Ask"}
              </button>
            </div>
          </div>
        )}

        {!timeUp && myGuessesLeft > 0 && (
          <div className="card" style={{ marginTop: 10 }}>
            <div className="section-label">🎯 {myGuessesLeft} guess{myGuessesLeft !== 1 ? "es" : ""} remaining</div>
            <div className="guess-wrap">
              <input className="guess-input" placeholder="Type a player name…"
                value={guessInput}
                onChange={e => setGuessInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitGuess()} />
            </div>
            <button className="btn-primary" style={{ marginTop: 10 }} disabled={!guessInput.trim()} onClick={submitGuess}>
              Submit Guess
            </button>
            {guessResult === "wrong" && myGuessesLeft > 0 && (
              <div className="guess-flash wrong" style={{ marginTop: 10 }}>❌ Wrong! {myGuessesLeft} guess{myGuessesLeft !== 1 ? "es" : ""} left</div>
            )}
          </div>
        )}

        {timeUp && (
          <div className="card" style={{ marginTop: 10, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏰</div>
            <div>Time's up! The player was <strong>{secretPlayer}</strong></div>
          </div>
        )}

        <Scoreboard scores={gs.scores} players={players} />
      </div>
    );
  }

  // ── ROUND END ─────────────────────────────────────────────────────────────
  if (gs.phase === "round_end") {
    const isHost = gs.hostId === playerId;
    const allDone = (gs.roundOrder?.length ?? 0) >= Object.keys(players).length;
    return (
      <div className="game-screen">
        <div className="phase-header">
          <div className="phase-label">Round {gs.round} complete</div>
          <div className="phase-title">🏁 Round Over</div>
        </div>
        <div className="card">
          <div className="result-label">The player was</div>
          <div className="result-player">{secretPlayer}</div>
          <div style={{ marginTop: 16 }}>
            {Object.values(players).filter(p => p.id !== gs.clueGiver).map(p => {
              const correct = gs.correctGuessers?.[p.id];
              const pts = gs.roundPoints?.[p.id] ?? 0;
              return (
                <div key={p.id} className="qa-row">
                  <span>{p.name}</span>
                  <span className={correct ? "yes" : "no"}>{correct ? "✅" : "❌"} +{pts} pts</span>
                </div>
              );
            })}
            {(() => {
              const giverPts = gs.roundPoints?.[gs.clueGiver] ?? 0;
              return giverPts > 0 ? (
                <div className="qa-row">
                  <span>{players[gs.clueGiver]?.name} (Clue Giver)</span>
                  <span className="yes">+{giverPts} pts — nobody guessed!</span>
                </div>
              ) : null;
            })()}
          </div>
        </div>
        <Scoreboard scores={gs.scores} players={players} />
        {isHost && (
          <button className="btn-primary" style={{ marginTop: 14 }} onClick={allDone ? resetToLobby : nextRound}>
            {allDone ? "🔄 Play Again" : "Next Round →"}
          </button>
        )}
        {!isHost && <p className="hint">Waiting for host…</p>}
      </div>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────
  if (gs.phase === "game_over") {
    const isHost = gs.hostId === playerId;
    const sorted = Object.values(players).sort((a, b) => (gs.scores?.[b.id] ?? 0) - (gs.scores?.[a.id] ?? 0));
    return (
      <div className="game-screen">
        <div className="waiting-center">
          <div className="big-emoji">🏆</div>
          <div className="wait-title">Game Over!</div>
          <div className="card" style={{ width: "100%", marginTop: 12 }}>
            {sorted.map((p, i) => (
              <div key={p.id} className="qa-row" style={i === 0 ? { borderColor: "#f59e0b", color: "#f59e0b" } : {}}>
                <span>{["🥇","🥈","🥉"][i] ?? `${i+1}.`} {p.name}</span>
                <span style={{ fontWeight: 700 }}>{gs.scores?.[p.id] ?? 0} pts</span>
              </div>
            ))}
          </div>
          {isHost && <button className="btn-primary" style={{ marginTop: 14, width: "100%" }} onClick={resetToLobby}>🔄 Play Again</button>}
          {!isHost && <p className="hint">Waiting for host…</p>}
        </div>
      </div>
    );
  }

  return <div className="waiting-center"><div className="wait-title">Loading…</div></div>;

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  async function startGame() {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const playerIds = Object.keys(current.players ?? {});
    if (playerIds.length < 2) return;
    const giverId = playerIds[Math.floor(Math.random() * playerIds.length)];
    await supabase.from("rooms").update({
      game_state: { ...current, phase: "pick_player", clueGiver: giverId, round: 1,
        scores: Object.fromEntries(playerIds.map(id => [id, 0])),
        roundOrder: [giverId], guessesLeft: {}, guessersDone: {},
        correctGuessers: {}, roundPoints: {}, clues: [], secretPlayer: null }
    }).eq("id", roomId);
  }

  async function submitClues(player, cluesToSubmit) {
    await patch({
      phase: "guessing", secretPlayer: player,
      clues: cluesToSubmit.map(c => c.trim()),
      guessesLeft: Object.fromEntries(Object.keys(gs.players).filter(id => id !== playerId).map(id => [id, 2])),
      guessersDone: {}, correctGuessers: {}, roundPoints: {},
    });
  }

  async function askQuestion() {
    if (!questionInput.trim() || askingQuestion) return;
    setAskingQuestion(true);
    const q = questionInput.trim();
    setQuestionInput("");
    const answer = await getAIAnswer(secretPlayer, q);
    setMyQuestions(prev => [...prev, { question: q, answer }]);
    setAskingQuestion(false);
  }

  async function submitGuess() {
    if (!guessInput.trim()) return;
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const correct = guessInput.trim().toLowerCase() === (current.secretPlayer || "").toLowerCase();
    const guessNumber = 2 - (current.guessesLeft?.[playerId] ?? 2) + 1;
    const usedAllQuestions = myQuestions.length >= 3;
    let pts = POINTS.wrong;
    if (correct) {
      if (guessNumber === 1) pts = POINTS.firstGuess;
      else if (usedAllQuestions) pts = POINTS.allQuestions;
      else pts = POINTS.secondGuess;
    }
    const newGuessesLeft = Math.max(0, (current.guessesLeft?.[playerId] ?? 2) - 1);
    const done = correct || newGuessesLeft === 0;
    const newScores = { ...(current.scores ?? {}) };
    if (pts > 0) newScores[playerId] = (newScores[playerId] ?? 0) + pts;
    const newGuessersDone = { ...(current.guessersDone ?? {}), ...(done ? { [playerId]: true } : {}) };
    const newCorrectGuessers = { ...(current.correctGuessers ?? {}), ...(correct ? { [playerId]: true } : {}) };
    const newRoundPoints = { ...(current.roundPoints ?? {}), ...(done ? { [playerId]: pts } : {}) };
    const newGuessesLeftMap = { ...(current.guessesLeft ?? {}), [playerId]: newGuessesLeft };
    const allGuessers = Object.keys(current.players ?? {}).filter(id => id !== current.clueGiver);
    const allDone = allGuessers.every(id => id === playerId ? done : newGuessersDone[id]);
    let finalScores = { ...newScores };
    let finalRoundPoints = { ...newRoundPoints };
    if (allDone && !Object.values(newCorrectGuessers).some(Boolean)) {
      finalScores[current.clueGiver] = (finalScores[current.clueGiver] ?? 0) + POINTS.noGuess;
      finalRoundPoints[current.clueGiver] = POINTS.noGuess;
    }
    await supabase.from("rooms").update({
      game_state: { ...current, guessesLeft: newGuessesLeftMap, guessersDone: newGuessersDone,
        correctGuessers: newCorrectGuessers, roundPoints: finalRoundPoints, scores: finalScores,
        phase: allDone ? "round_end" : "guessing" }
    }).eq("id", roomId);
    setGuessResult(correct ? "correct" : done ? "out" : "wrong");
    setGuessInput("");
  }

  async function endRound() {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const anyCorrect = Object.values(current.correctGuessers ?? {}).some(Boolean);
    let finalScores = { ...(current.scores ?? {}) };
    if (!anyCorrect) finalScores[current.clueGiver] = (finalScores[current.clueGiver] ?? 0) + POINTS.noGuess;
    await supabase.from("rooms").update({ game_state: { ...current, scores: finalScores, phase: "round_end" } }).eq("id", roomId);
  }

  async function nextRound() {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const playerIds = Object.keys(current.players ?? {});
    const roundOrder = current.roundOrder ?? [];
    const remaining = playerIds.filter(id => !roundOrder.includes(id));
    if (remaining.length === 0) {
      await supabase.from("rooms").update({ game_state: { ...current, phase: "game_over" } }).eq("id", roomId);
      return;
    }
    const nextGiver = remaining[Math.floor(Math.random() * remaining.length)];
    await supabase.from("rooms").update({
      game_state: { ...current, phase: "pick_player", clueGiver: nextGiver,
        round: (current.round ?? 1) + 1, roundOrder: [...roundOrder, nextGiver],
        guessesLeft: {}, guessersDone: {}, correctGuessers: {}, roundPoints: {}, clues: [], secretPlayer: null }
    }).eq("id", roomId);
  }

  async function resetToLobby() {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    await supabase.from("rooms").update({
      game_state: { players: current.players, hostId: current.hostId, phase: "lobby",
        scores: {}, round: 0, roundOrder: [], clueGiver: null, secretPlayer: null,
        clues: [], guessesLeft: {}, guessersDone: {}, correctGuessers: {}, roundPoints: {} }
    }).eq("id", roomId);
  }
}

function Scoreboard({ scores, players }) {
  if (!scores || !players) return null;
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return (
    <div className="mini-scores" style={{ marginTop: 14 }}>
      <div className="section-label">Scoreboard</div>
      {sorted.map(([id, pts]) => (
        <div key={id} className="qa-row">
          <span>{players[id]?.name ?? id}</span>
          <span style={{ fontWeight: 700, color: "#4da6ff" }}>{pts} pts</span>
        </div>
      ))}
    </div>
  );
}
