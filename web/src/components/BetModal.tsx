// -----------------------------------------------------------------------------
// BetModal.tsx — the popup where the user builds and places a bet
// -----------------------------------------------------------------------------
// Given a game and a bet type, it shows the available pick buttons, a stake
// input with live "you could win" preview, and submits to the server. The
// parent is responsible for re-fetching data after a successful bet.
// -----------------------------------------------------------------------------

import { FormEvent, useState } from "react";
import { placeBet } from "../api";
import type { Game } from "../types";

interface Props {
  game: Game;
  betType: string;
  onClose: () => void;
  onPlaced?: () => void; // callback after a successful bet
  onAddToParlay?: (pick: { gameId: number; type: string; pick: string }) => void;
}

const ODDS = 1.91; // matches the server's flat odds

const PICK_OPTIONS: Record<string, { value: string; label: string }[]> = {
  // Moneyline labels are filled in below with the actual team names.
  MONEYLINE: [
    { value: "away", label: "" },
    { value: "home", label: "" },
  ],
  OVER_UNDER: [
    { value: "over", label: "Over" },
    { value: "under", label: "Under" },
  ],
  SPREAD: [
    { value: "home", label: "Home -1.5" },
    { value: "away", label: "Away +1.5" },
  ],
};

export default function BetModal({ game, betType, onClose, onPlaced, onAddToParlay }: Props) {
  // The currently-selected pick and the stake the user types in.
  const [pick, setPick] = useState<string | null>(null);
  const [stake, setStake] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stakeNum = Number(stake);
  const potential = stakeNum > 0 ? stakeNum * ODDS : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pick) {
      setError("Pick a side first");
      return;
    }
    try {
      await placeBet({ gameId: game.id, type: betType, pick, stake: stakeNum });
      setSuccess("Bet placed! 🎉");
      setError("");
      setStake("");
      onPlaced?.(); // tell the parent to refresh
      // Keep the modal open briefly so the user sees the confirmation.
      setTimeout(onClose, 800);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong");
    }
  }

  // "Add to parlay" doesn't stake anything yet — it just adds this pick to the
  // parlay basket, then closes the modal so the slip at the bottom updates.
  function handleAddToParlay() {
    if (!pick) {
      setError("Pick a side first");
      return;
    }
    onAddToParlay?.({ gameId: game.id, type: betType, pick });
    onClose();
  }

  return (
    // The dark overlay behind the modal.
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation so clicking inside the box doesn't close it */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{betType.replace("_", " ")} bet</h2>
        <p className="modal-matchup">
          {game.awayTeam} @ {game.homeTeam}
        </p>

        <div className="pick-row">
          {(PICK_OPTIONS[betType] ?? []).map((opt) => (
            <button
              key={opt.value}
              className={`pick-btn ${pick === opt.value ? "selected" : ""}`}
              type="button"
              onClick={() => setPick(opt.value)}
            >
              {/* Moneyline shows the team names; other types show their labels. */}
              {opt.label || (opt.value === "home" ? game.homeTeam : game.awayTeam)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Stake (€)
            <input
              type="number"
              min="1"
              max="500"
              step="0.5"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="e.g. 5"
            />
          </label>

          {stakeNum > 0 && (
            <p className="potential">Potential win: €{potential.toFixed(2)}</p>
          )}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          <div className="modal-actions">
            <button className="btn btn-outline" type="button" onClick={onClose}>
              Cancel
            </button>
            {/* Only show "Add to parlay" when the Dashboard wired up the handler. */}
            {onAddToParlay && (
              <button className="btn btn-ghost" type="button" onClick={handleAddToParlay}>
                Add to parlay
              </button>
            )}
            <button className="btn btn-primary" type="submit">
              Place bet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}