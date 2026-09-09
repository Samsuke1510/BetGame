// -----------------------------------------------------------------------------
// GameCard.tsx — one card showing a single MLB game + its bet buttons
// -----------------------------------------------------------------------------
// Shows the matchup and, when the game is over, the final score. The three
// buttons each open the BetModal pre-set for one bet type.
// -----------------------------------------------------------------------------

import { useState } from "react";
import type { Game } from "../types";
import BetModal from "./BetModal";

interface Props {
  game: Game;
  onPlaced?: () => void; // called when a bet on this game is placed
}

// Fancy names for the three bet types, shown to the user.
const BET_TYPE_LABELS: Record<string, string> = {
  MONEYLINE: "Win / Loss",
  OVER_UNDER: "Over / Under",
  SPREAD: "Point Spread",
};

export default function GameCard({ game, onPlaced }: Props) {
  // Which bet type, if any, the modal should show. null = closed.
  const [modalType, setModalType] = useState<string | null>(null);

  const isFinal = game.status === "FINAL";
  const score = isFinal ? `${game.awayScore} - ${game.homeScore}` : "";

  return (
    <div className="game-card">
      <div className="game-teams">
        <span className="team">{game.awayTeam}</span>
        <span className="at">@</span>
        <span className="team">{game.homeTeam}</span>
        <span className="score">{score}</span>
      </div>

      <div className="game-lines">
        <span>Total line: {game.totalLine}</span>
        <span>Home spread: {game.spread}</span>
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
        />
      )}
    </div>
  );
}