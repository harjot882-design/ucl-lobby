import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import ClueEntry from "./ClueEntry";

const UCL_PLAYERS = [
  "Erling Haaland","Kylian Mbappé","Vinicius Jr","Jude Bellingham","Mohamed Salah",
  "Bukayo Saka","Phil Foden","Kevin De Bruyne","Lamine Yamal","Pedri",
  "Rodri","Toni Kroos","Bernardo Silva","Raphinha","Leroy Sané",
  "Jamal Musiala","Florian Wirtz","Harry Kane","Robert Lewandowski","Khvicha Kvaratskhelia",
  "Victor Osimhen","Marcus Rashford","Rúben Dias","Virgil van Dijk","Thibaut Courtois",
  "Ederson","Alisson Becker","Gianluigi Donnarumma","Marquinhos","Antonio Rüdiger",
  "Achraf Hakimi","João Cancelo","Trent Alexander-Arnold","Andrew Robertson","Theo Hernández",
  "Ousmane Dembélé","Neymar Jr","Antoine Griezmann","Paulo Dybala","Nicolás González",
  "Dušan Vlahović","Gabriel Martinelli","Gabriel Jesus","Darwin Núñez","Cody Gakpo",
  "Federico Chiesa","Nicolo Barella","Mike Maignan","Brahim Díaz","Eduardo Camavinga"
];

const POINTS = { firstGuess: 5, secondGuess: 3, allQuestions: 2, noGuess: 4, wrong: 0 };
const QUESTION_TIMER = 5 * 60; // 5 minutes in seconds

// ── Anthropic AI answer function ──────────────────────────────────────────────
async function getAIAnswer(playerName, question) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 50,
        system: `You are a football expert answering yes/no questions about UCL players. 
Answer ONLY with "Yes" or "No" — nothing else, no punctuation, no explanation.
Be accurate about the player's club, nationality, position, age, and career facts as of the 2024/25 season.`,
        messages: [
          {
            role: "user",
            content: `The secret player is: ${playerName}\nQuestion: ${question}\nAnswer with only Yes or No:`
          }
        ]
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
  const [guessResult, setGuessResult] = useState(null); // null | "correct" | "wrong" | "out"
  const [myQuestions, setMyQuestions] = useState([]); // { question, answer }[]
  const [questionInput, setQuestionInput] = useState("");
  const [askingQuestion, setAskingQuestion] = useState(false);
  const timerRef = useRef(null);

  // ── Subscribe to game state ───────────────────────────────────────────────
  useEffect(() => {
    const fetchGs = async () => {
      const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
      if (data?.game_state) setGs(data.game_state);
    };
    fetchGs();

    const channel = supabase.channel(`room-${roomId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.new?.game_state) setGs(payload.new.game_state);
        })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [roomId]);

  // ── Guessing timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (gs?.phase !== "guessing") return;
    const isGiver = gs.clueGiver === playerId;
    if (isGiver) return;

    clearInterval(timerRef.current);
    setTimeLeft(QUESTION_TIMER);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gs?.phase, gs?.clueGiver, playerId]);

  // ── Reset local state on new round ───────────────────────────────────────
  useEffect(() => {
    setMyQuestions([]);
    setGuessResult(null);
    setGuessInput("");
    setQuestionInput("");
  }, [gs?.round]);

  if (!gs) return <div className="loading">Loading game…</div>;

  const players = gs.players || {};
  const isGiver = gs.clueGiver === playerId;
  const myScore = gs.scores?.[playerId] ?? 0;
  const secretPlayer = gs.secretPlayer;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const patch = async (updates) => {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const merged = deepMerge(current, updates);
    await supabase.from("rooms").update({ game_state: merged }).eq("id", roomId);
  };

  function deepMerge(base, update) {
    const result = { ...base };
    for (const key of Object.keys(update)) {
      if (update[key] && typeof update[key] === "object" && !Array.isArray(update[key]) && base[key] && typeof base[key] === "object") {
        result[key] = deepMerge(base[key], update[key]);
      } else {
        result[key] = update[key];
      }
    }
    return result;
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Phase: waiting for host to start ─────────────────────────────────────
  if (gs.phase === "lobby") {
    const isHost = gs.hostId === playerId;
    const playerList = Object.values(players);
    return (
      <div className="phase-card">
        <h2>🏟️ UCL Guesser</h2>
        <p className="room-code">Room: <strong>{roomId}</strong></p>
        <div className="player-list">
          <h3>Players ({playerList.length})</h3>
          {playerList.map(p => (
            <div key={p.id} className="player-item">
              {p.name} {p.id === gs.hostId ? "👑" : ""}
            </div>
          ))}
        </div>
        {isHost ? (
          playerList.length < 2
            ? <p className="hint">Waiting for at least 2 players…</p>
            : <button className="btn-primary" onClick={startGame}>▶ Start Game</button>
        ) : (
          <p className="hint">Waiting for host to start…</p>
        )}
      </div>
    );
  }

  // ── Phase: pick_player ────────────────────────────────────────────────────
  if (gs.phase === "pick_player") {
    if (!isGiver) {
      return (
        <div className="phase-card">
          <h2>⏳ Waiting…</h2>
          <p><strong>{players[gs.clueGiver]?.name}</strong> is choosing a player and writing clues.</p>
          <Scoreboard scores={gs.scores} players={players} />
        </div>
      );
    }
    return (
      <div className="phase-card">
        <h2>🎯 You're the Clue Giver!</h2>
        <p>Pick a UCL player — don't tell anyone!</p>
        <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="player-select">
          <option value="">— Choose a player —</option>
          {UCL_PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {selectedPlayer && (
          <div className="clues-section">
            <h3>Write 3 clues about <em>{selectedPlayer}</em></h3>
            <p className="hint">Be creative — don't make it too easy!</p>
            {clues.map((c, i) => (
              <input key={i} className="clue-input" placeholder={`Clue ${i + 1}`} value={c}
                onChange={e => setClues(prev => prev.map((v, j) => j === i ? e.target.value : v))} />
            ))}
            <button className="btn-primary"
              disabled={clues.some(c => !c.trim())}
              onClick={() => submitClues(selectedPlayer, clues)}>
              Lock Clues →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Phase: guessing ───────────────────────────────────────────────────────
  if (gs.phase === "guessing") {
    const myGuessesLeft = gs.guessesLeft?.[playerId] ?? 2;
    const myQuestionCount = myQuestions.length;
    const questionsLeft = 3 - myQuestionCount;
    const clueList = gs.clues || [];
    const timeUp = timeLeft === 0;

    if (isGiver) {
      const allGuessers = Object.values(players).filter(p => p.id !== gs.clueGiver);
      const finished = allGuessers.every(p => gs.guessersDone?.[p.id]);
      return (
        <div className="phase-card">
          <h2>🕵️ Guessers are playing…</h2>
          <p>Your player: <strong>{secretPlayer}</strong></p>
          <div className="clue-display">
            {clueList.map((c, i) => <div key={i} className="clue-pill">💡 {c}</div>)}
          </div>
          <div className="guesser-status">
            {allGuessers.map(p => (
              <div key={p.id} className="guesser-row">
                {p.name}: {gs.guessersDone?.[p.id]
                  ? (gs.correctGuessers?.[p.id] ? "✅ Guessed it!" : "❌ Didn't get it")
                  : "⏳ Still guessing…"}
              </div>
            ))}
          </div>
          {finished && (
            <button className="btn-primary" onClick={endRound}>Next Round →</button>
          )}
        </div>
      );
    }

    // Guesser view
    const done = gs.guessersDone?.[playerId];
    if (done) {
      const correct = gs.correctGuessers?.[playerId];
      return (
        <div className={`phase-card result-card ${correct ? "result-correct" : "result-wrong"}`}>
          <div className="result-icon">{correct ? "✅" : "❌"}</div>
          <h2>{correct ? "Correct! Well done!" : "Didn't get it this round!"}</h2>
          {!correct && <p className="reveal">The player was <strong>{secretPlayer}</strong></p>}
          <p>Waiting for other guessers to finish…</p>
          <Scoreboard scores={gs.scores} players={players} />
        </div>
      );
    }

    return (
      <div className="phase-card">
        <h2>🔍 Guess the Player!</h2>

        {/* Timer */}
        <div className={`timer ${timeLeft < 30 ? "timer-urgent" : ""}`}>
          ⏱ {fmt(timeLeft)}
        </div>

        {/* Clues */}
        <div className="clue-display">
          <h3>Clues</h3>
          {clueList.map((c, i) => <div key={i} className="clue-pill">💡 {c}</div>)}
        </div>

        {/* My Q&A history */}
        {myQuestions.length > 0 && (
          <div className="qa-list">
            {myQuestions.map((qa, i) => (
              <div key={i} className={`qa-row ${qa.answer === "Yes" ? "qa-yes" : "qa-no"}`}>
                <span className="qa-q">Q{i + 1}: {qa.question}</span>
                <span className="qa-a">{qa.answer === "Yes" ? "✅ Yes" : "❌ No"}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ask a question */}
        {!timeUp && questionsLeft > 0 && (
          <div className="ask-section">
            <p className="hint">{questionsLeft} question{questionsLeft !== 1 ? "s" : ""} left</p>
            <div className="ask-row">
              <input className="clue-input" placeholder="Ask a yes/no question…"
                value={questionInput}
                onChange={e => setQuestionInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !askingQuestion && askQuestion()}
              />
              <button className="btn-secondary" disabled={!questionInput.trim() || askingQuestion}
                onClick={askQuestion}>
                {askingQuestion ? "…" : "Ask"}
              </button>
            </div>
          </div>
        )}

        {/* Guess input */}
        {!timeUp && myGuessesLeft > 0 && (
          <div className="guess-section">
            <p className="hint">🎯 {myGuessesLeft} guess{myGuessesLeft !== 1 ? "es" : ""} left</p>
            <select value={guessInput} onChange={e => setGuessInput(e.target.value)} className="player-select">
              <option value="">— Select your guess —</option>
              {UCL_PLAYERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button className="btn-primary" disabled={!guessInput} onClick={submitGuess}>
              Submit Guess
            </button>
          </div>
        )}

        {timeUp && (
          <div className="result-card result-wrong">
            <p>⏰ Time's up! The player was <strong>{secretPlayer}</strong></p>
          </div>
        )}

        {guessResult === "wrong" && myGuessesLeft > 0 && (
          <div className="flash-wrong">❌ Wrong! {myGuessesLeft} guess{myGuessesLeft !== 1 ? "es" : ""} left</div>
        )}

        <Scoreboard scores={gs.scores} players={players} />
      </div>
    );
  }

  // ── Phase: round_end ──────────────────────────────────────────────────────
  if (gs.phase === "round_end") {
    const isHost = gs.hostId === playerId;
    const allDone = (gs.roundOrder?.length ?? 0) >= Object.keys(players).length;

    return (
      <div className="phase-card">
        <h2>🏁 Round Over</h2>
        <p>The player was <strong>{secretPlayer}</strong></p>

        <div className="round-results">
          {Object.values(players).filter(p => p.id !== gs.clueGiver).map(p => {
            const correct = gs.correctGuessers?.[p.id];
            const pointsEarned = gs.roundPoints?.[p.id] ?? 0;
            return (
              <div key={p.id} className={`result-row ${correct ? "qa-yes" : "qa-no"}`}>
                <span>{p.name}</span>
                <span>{correct ? "✅" : "❌"} +{pointsEarned} pts</span>
              </div>
            );
          })}
          {/* Clue giver points */}
          {(() => {
            const giverPoints = gs.roundPoints?.[gs.clueGiver] ?? 0;
            return giverPoints > 0 ? (
              <div className="result-row qa-yes">
                <span>{players[gs.clueGiver]?.name} (Clue Giver)</span>
                <span>✅ +{giverPoints} pts (nobody guessed)</span>
              </div>
            ) : null;
          })()}
        </div>

        <Scoreboard scores={gs.scores} players={players} />

        {isHost && (
          <button className="btn-primary" onClick={allDone ? resetToLobby : nextRound}>
            {allDone ? "🔄 Play Again" : "Next Round →"}
          </button>
        )}
        {!isHost && <p className="hint">Waiting for host…</p>}
      </div>
    );
  }

  // ── Phase: game_over ──────────────────────────────────────────────────────
  if (gs.phase === "game_over") {
    const sortedPlayers = Object.values(players).sort((a, b) => (gs.scores?.[b.id] ?? 0) - (gs.scores?.[a.id] ?? 0));
    const isHost = gs.hostId === playerId;
    return (
      <div className="phase-card">
        <h2>🏆 Game Over!</h2>
        <div className="final-scores">
          {sortedPlayers.map((p, i) => (
            <div key={p.id} className={`score-row ${i === 0 ? "winner" : ""}`}>
              <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {p.name}</span>
              <span>{gs.scores?.[p.id] ?? 0} pts</span>
            </div>
          ))}
        </div>
        {isHost && (
          <button className="btn-primary" onClick={resetToLobby}>🔄 Play Again</button>
        )}
        {!isHost && <p className="hint">Waiting for host to start a new game…</p>}
      </div>
    );
  }

  return <div className="loading">Loading…</div>;

  // ── Actions ───────────────────────────────────────────────────────────────

  async function startGame() {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const playerIds = Object.keys(current.players ?? {});
    if (playerIds.length < 2) return;

    const giverId = playerIds[Math.floor(Math.random() * playerIds.length)];
    await supabase.from("rooms").update({
      game_state: {
        ...current,
        phase: "pick_player",
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
    }).eq("id", roomId);
  }

  async function submitClues(player, cluesToSubmit) {
    await patch({
      phase: "guessing",
      secretPlayer: player,
      clues: cluesToSubmit.map(c => c.trim()),
      guessesLeft: Object.fromEntries(
        Object.keys(gs.players).filter(id => id !== playerId).map(id => [id, 2])
      ),
      guessersDone: {},
      correctGuessers: {},
      roundPoints: {},
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
    if (!guessInput) return;
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};

    const correct = guessInput.trim().toLowerCase() === (current.secretPlayer || "").toLowerCase();
    const guessNumber = 2 - (current.guessesLeft?.[playerId] ?? 2) + 1; // 1st or 2nd
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

    // Check if all guessers are done
    const allGuessers = Object.keys(current.players ?? {}).filter(id => id !== current.clueGiver);
    const allDone = allGuessers.every(id => id === playerId ? done : newGuessersDone[id]);

    // If nobody guessed correctly, clue giver gets 4 pts
    let finalScores = { ...newScores };
    let finalRoundPoints = { ...newRoundPoints };
    if (allDone) {
      const anyCorrect = Object.values(newCorrectGuessers).some(Boolean);
      if (!anyCorrect) {
        finalScores[current.clueGiver] = (finalScores[current.clueGiver] ?? 0) + POINTS.noGuess;
        finalRoundPoints[current.clueGiver] = POINTS.noGuess;
      }
    }

    await supabase.from("rooms").update({
      game_state: {
        ...current,
        guessesLeft: newGuessesLeftMap,
        guessersDone: newGuessersDone,
        correctGuessers: newCorrectGuessers,
        roundPoints: finalRoundPoints,
        scores: finalScores,
        phase: allDone ? "round_end" : "guessing",
      }
    }).eq("id", roomId);

    setGuessResult(correct ? "correct" : done ? "out" : "wrong");
    setGuessInput("");
  }

  async function endRound() {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    const allGuessers = Object.keys(current.players ?? {}).filter(id => id !== current.clueGiver);
    const anyCorrect = Object.values(current.correctGuessers ?? {}).some(Boolean);
    let finalScores = { ...(current.scores ?? {}) };
    if (!anyCorrect) {
      finalScores[current.clueGiver] = (finalScores[current.clueGiver] ?? 0) + POINTS.noGuess;
    }
    await supabase.from("rooms").update({
      game_state: { ...current, scores: finalScores, phase: "round_end" }
    }).eq("id", roomId);
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
      game_state: {
        ...current,
        phase: "pick_player",
        clueGiver: nextGiver,
        round: (current.round ?? 1) + 1,
        roundOrder: [...roundOrder, nextGiver],
        guessesLeft: {},
        guessersDone: {},
        correctGuessers: {},
        roundPoints: {},
        clues: [],
        secretPlayer: null,
      }
    }).eq("id", roomId);
  }

  async function resetToLobby() {
    const { data } = await supabase.from("rooms").select("game_state").eq("id", roomId).single();
    const current = data?.game_state ?? {};
    await supabase.from("rooms").update({
      game_state: {
        players: current.players,
        hostId: current.hostId,
        phase: "lobby",
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
    }).eq("id", roomId);
  }
}

// ── Scoreboard component ─────────────────────────────────────────────────────
function Scoreboard({ scores, players }) {
  if (!scores || !players) return null;
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return (
    <div className="scoreboard">
      <h4>Scoreboard</h4>
      {sorted.map(([id, pts]) => (
        <div key={id} className="score-row">
          <span>{players[id]?.name ?? id}</span>
          <span>{pts} pts</span>
        </div>
      ))}
    </div>
  );
}
