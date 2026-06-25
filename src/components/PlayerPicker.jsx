// PlayerPicker.jsx
// Replaces the simple <select> in Game.jsx for picking the secret player
// Shows: League tabs → Team grid → Player list

import { useState } from "react";
import { PLAYER_DATABASE, LEAGUES, getTeams, getPlayers } from "../lib/playerDatabase";

const LEAGUE_FLAGS = {
  "Premier League": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "La Liga": "🇪🇸",
  "Bundesliga": "🇩🇪",
  "Serie A": "🇮🇹",
  "Ligue 1": "🇫🇷",
};

export default function PlayerPicker({ onSelect }) {
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [search, setSearch] = useState("");

  const handleLeague = (league) => {
    setSelectedLeague(league);
    setSelectedTeam(null);
    setSearch("");
  };

  const handleTeam = (team) => {
    setSelectedTeam(team);
    setSearch("");
  };

  const handleBack = () => {
    if (selectedTeam) {
      setSelectedTeam(null);
    } else {
      setSelectedLeague(null);
    }
    setSearch("");
  };

  // Search across all players
  const searchResults = search.length > 1
    ? Object.entries(PLAYER_DATABASE).flatMap(([league, teams]) =>
        Object.entries(teams).flatMap(([team, players]) =>
          players
            .filter(p => p.toLowerCase().includes(search.toLowerCase()))
            .map(p => ({ player: p, team, league }))
        )
      )
    : [];

  // ── Search view ──────────────────────────────────────────────────────────
  return (
    <div className="picker-container">
      {/* Search bar always visible */}
      <div className="picker-search">
        <input
          className="clue-input"
          placeholder="🔍 Search any player…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {search.length > 1 ? (
        <div className="picker-list">
          {searchResults.length === 0
            ? <p className="hint">No players found</p>
            : searchResults.map(({ player, team, league }) => (
              <button key={player} className="picker-player-btn" onClick={() => onSelect(player)}>
                <span className="player-name">{player}</span>
                <span className="player-meta">{LEAGUE_FLAGS[league]} {team}</span>
              </button>
            ))
          }
        </div>
      ) : !selectedLeague ? (
        /* ── League selection ─────────────────────────────────────────── */
        <div>
          <p className="picker-label">Select a league</p>
          <div className="picker-league-grid">
            {LEAGUES.map(league => (
              <button key={league} className="picker-league-btn" onClick={() => handleLeague(league)}>
                <span className="league-flag">{LEAGUE_FLAGS[league]}</span>
                <span className="league-name">{league}</span>
                <span className="league-count">{getTeams(league).length} clubs</span>
              </button>
            ))}
          </div>
        </div>
      ) : !selectedTeam ? (
        /* ── Team selection ───────────────────────────────────────────── */
        <div>
          <button className="picker-back" onClick={handleBack}>← Back</button>
          <p className="picker-label">{LEAGUE_FLAGS[selectedLeague]} {selectedLeague} — pick a team</p>
          <div className="picker-team-grid">
            {getTeams(selectedLeague).map(team => (
              <button key={team} className="picker-team-btn" onClick={() => handleTeam(team)}>
                {team}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Player selection ─────────────────────────────────────────── */
        <div>
          <button className="picker-back" onClick={handleBack}>← Back to teams</button>
          <p className="picker-label">{selectedTeam} — pick the secret player</p>
          <div className="picker-list">
            {getPlayers(selectedLeague, selectedTeam).map(player => (
              <button key={player} className="picker-player-btn" onClick={() => onSelect(player)}>
                <span className="player-name">{player}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
