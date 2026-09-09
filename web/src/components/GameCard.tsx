// -----------------------------------------------------------------------------
// GameCard.tsx — one card showing a single MLB game + its bet buttons
// -----------------------------------------------------------------------------
// Shows the matchup (colored with each team's brand color), the start time in
// Paris time, and — once the game is over — the final score. The three buttons
// each open the BetModal pre-set for one bet type.
// -----------------------------------------------------------------------------

import { useState, type CSSProperties } from "react";
import type { Game, ParlayPick } from "../types";
import { teamColor } from "../data/teamColors";
import { formatGameTime } from "../utils/date";
import BetModal from "./BetModal";

// Flat odds used across the app for every bet (matches the server config).
const LEG_ODDS = 1.91;

interface Props {
  game: Game;
  onPlaced?: () => void; // called when a bet on this game is placed
  onAddToParlay?: (pick: ParlayPick) => void; // called to add a pick to the slip
}

// Fancy names for the three bet types, shown to the user.
const BET_TYPE_LABELS: Record<string, string> = {
  MONEYLINE: "Win / Loss",
  OVER_UNDER: "Over / Under",
  SPREAD: "Point Spread",
};

export default function GameCard({ game, onPlaced, onAddToParlay }: Props) {
  // Which bet type, if any, the modal should show. null = closed.
  const [modalType, setModalType] = useState<string | null>(null);

  const isFinal = game.status === "FINAL";
  const score = isFinal ? `${game.awayScore} - ${game.homeScore}` : "";

  // CSS variables that carry the two teams' colors into the card's styles.
  const style = {
    "--away-color": teamColor(game.awayTeam),
    "--home-color": teamColor(game.homeTeam),
  } as CSSProperties;

  // Turn a raw pick (from the modal) into a friendly ParlayPick for the slip.
  function handleAddToParlay(plain: { gameId: number; type: string; pick: string }) {
    if (!onAddToParlay) return;

    let label: string;
    if (plain.type === "MONEYLINE") {
      label = `${plain.pick === "home" ? game.homeTeam : game.awayTeam} to win`;
    } else if (plain.type === "OVER_UNDER") {
      label = `${plain.pick === "over" ? "Over" : "Under"} ${game.totalLine}`;
    } else {
      label = plain.pick === "home" ? `${game.homeTeam} -1.5` : `${game.awayTeam} +1.5`;
    }

    onAddToParlay({ gameId: game.id, type: plain.type, pick: plain.pick, odds: LEG_ODDS, label });
  }

  return (
    <div className="game-card" style={style}>
      {/* Top stripe: a gradient blending the away team color into the home color. */}
      <div className="game-stripe" />

      <div className="game-teams">
        <span className="team team-away">
          <span className="team-dot" />
          {game.awayTeam}
        </span>
        <span className="at">@</span>
        <span className="team team-home">
          <span className="team-dot" />
          {game.homeTeam}
        </span>
        <span className="score">{score}</span>
      </div>

      <div className="game-meta">
        {/* Game start time, converted to Paris time (see utils/date.ts). */}
        <span className="time-badge">🕐 {formatGameTime(game.gameTime)}</span>
        <span className="game-lines">
          Total {game.totalLine} · Home {game.spread}
        </span>
      </div>

      <div className="bet-buttons">
        {isFinal ? (
          <span className="final-label">Game finished</span>
        ) : (
          Object.entries(BET_TYPE_LABELS).map(([type, label]) => (
            <button key={type} className="btn btn-ghost" onClick={() => setModalType(type)}>
              {label}
            </button>
          ))
        )}
      </div>

      {/* Render the modal only when it's been opened for this game. */}
      {modalType && (
        <BetModal
          game={game}
          betType={modalType}
          onClose={() => setModalType(null)}
          onPlaced={onPlaced}
          onAddToParlay={handleAddToParlay}
        />
      )}
    </div>
  );
}