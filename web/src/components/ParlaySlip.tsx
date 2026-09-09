// -----------------------------------------------------------------------------
// ParlaySlip.tsx — the bottom bar that builds a parlay before you submit it
// -----------------------------------------------------------------------------
// Shows every pick you've added from the game cards, computes the COMBINED
// odds (each leg's odds multiplied together — that's what makes parlays risky
// and exciting), and lets you set one stake and submit the whole ticket.
// -----------------------------------------------------------------------------

import { useState } from "react";
import type { ParlayPick } from "../types";

interface Props {
  picks: ParlayPick[];
  onRemove: (gameId: number) => void;
  onPlace: (legs: { gameId: number; type: string; pick: string }[], stake: number) => Promise<string | null>;
}

export default function ParlaySlip({ picks, onRemove, onPlace }: Props) {
  const [stake, setStake] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  // The headline number: multiply every leg's odds together (1.91 × 1.91 × …).
  const combinedOdds = picks.reduce((product, pick) => product * pick.odds, 1);

  const stakeNum = Number(stake);
  const potential = stakeNum > 0 ? stakeNum * combinedOdds : 0;

  async function handlePlace() {
    if (stakeNum <= 0) {
      setError("Enter a stake first");
      return;
    }
    setBusy(true);
    // Build the minimal leg list the API expects, and let the parent submit it.
    const legs = picks.map((p) => ({ gameId: p.gameId, type: p.type, pick: p.pick }));
    const err = await onPlace(legs, stakeNum);
    setBusy(false);

    if (err) {
      setError(err);
      return;
    }
    setSuccess("Parlay placed! 🎉");
    setError("");
    setStake("");
    // The parent clears the basket, which hides this bar (~success message gone
    // with it — the ticket is now visible in "My parlays" below anyway).
  }

  return (
    <div className="parlay-slip">
      <div className="slip-left">
        <h3 className="slip-title">Parlay slip</h3>

        {/* One row per pick, with a remove button. */}
        <ul className="slip-picks">
          {picks.map((pick) => (
            <li key={pick.gameId} className="slip-pick">
              <button className="slip-remove" onClick={() => onRemove(pick.gameId)} title="Remove">
                ✕
              </button>
              <span className="slip-label">{pick.label}</span>
              <span className="slip-odds">{pick.odds}</span>
            </li>
          ))}
        </ul>

        <p className="slip-combined">
          Combined odds: <strong>{combinedOdds.toFixed(2)}</strong>
        </p>
      </div>

      <div className="slip-right">
        <label className="slip-stake">
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

        {stakeNum > 0 && <p className="potential">Potential win: €{potential.toFixed(2)}</p>}

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button className="btn btn-primary" onClick={handlePlace} disabled={busy}>
          {busy ? "Placing…" : "Place parlay"}
        </button>
      </div>
    </div>
  );
}