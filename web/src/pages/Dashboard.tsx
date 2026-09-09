// -----------------------------------------------------------------------------
// Dashboard.tsx — the main page after login
// -----------------------------------------------------------------------------
// Sections: today's games to bet on (single or add-to-parlay), the parlay slip
// (bottom bar), the user's single bets, and their parlay tickets. It fetches
// from the server on load, and asks App to update the balance after any bet.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { fetchBets, fetchGames, fetchMe, fetchParlays, placeParlay as placeParlayApi } from "../api";
import GameCard from "../components/GameCard";
import ParlaySlip from "../components/ParlaySlip";
import type { Bet, Game, Parlay, ParlayPick, User } from "../types";

interface Props {
  user: User;
  onUserUpdate: (user: User) => void;
}

// Friendly labels for showing a bet/parlay status.
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  WON: "Won",
  LOST: "Lost",
  PUSH: "Refunded (push)",
};

const BET_LABELS: Record<string, string> = {
  MONEYLINE: "Win/Loss",
  OVER_UNDER: "Over/Under",
  SPREAD: "Spread",
};

export default function Dashboard({ user, onUserUpdate }: Props) {
  const [games, setGames] = useState<Game[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [parlays, setParlays] = useState<Parlay[]>([]);
  const [parlayPicks, setParlayPicks] = useState<ParlayPick[]>([]); // in-progress slip
  const [loading, setLoading] = useState(true);

  // Load everything from the server. useCallback lets us call refresh from both
  // the initial load and after placing a bet.
  const refresh = useCallback(async () => {
    const [g, b, p] = await Promise.all([fetchGames(), fetchBets(), fetchParlays()]);
    setGames(g);
    setBets(b);
    setParlays(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh everything + the balance after a single bet.
  const handleBetPlaced = useCallback(async () => {
    await refresh();
    const me = await fetchMe();
    onUserUpdate(me);
  }, [refresh, onUserUpdate]);

  // --- Parlay slip helpers ----------------------------------------------------

  // Add one pick to the slip. The backend insists on one leg per game, so we
  // ignore an attempt to add a second pick for the same game.
  function handleAddToParlay(pick: ParlayPick) {
    setParlayPicks((prev) =>
      prev.some((p) => p.gameId === pick.gameId) ? prev : [...prev, pick]
    );
  }

  function handleRemovePick(gameId: number) {
    setParlayPicks((prev) => prev.filter((p) => p.gameId !== gameId));
  }

  // Submit the whole slip. Returns an error string (or null on success) so the
  // slip bar can show it.
  const handlePlaceParlay = useCallback(
    async (legs: { gameId: number; type: string; pick: string }[], stake: number): Promise<string | null> => {
      try {
        await placeParlayApi(legs, stake);
        setParlayPicks([]);
        await refresh();
        const me = await fetchMe();
        onUserUpdate(me);
        return null;
      } catch (err: any) {
        return err.response?.data?.error ?? "Something went wrong";
      }
    },
    [refresh, onUserUpdate]
  );

  // Wins/losses totals for the summary panel.
  const won = bets.filter((b) => b.status === "WON").length;
  const lost = bets.filter((b) => b.status === "LOST").length;

  if (loading) return <p className="page-hint">Loading games…</p>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
        <p>Today's MLB games — pick a side, place a single bet, or build a parlay.</p>
      </header>

      <section className="summary">
        <h2>Your activity</h2>
        <p>
          <strong>Bets:</strong> {bets.length} &nbsp;·&nbsp;
          <strong>Won:</strong> {won} &nbsp;·&nbsp;
          <strong>Lost:</strong> {lost} &nbsp;·&nbsp;
          <strong>Parlays:</strong> {parlays.length}
        </p>
      </section>

      {/* Today's games */}
      <section>
        <h2>Today's games</h2>
        {games.length === 0 ? (
          <p className="page-hint">
            No MLB games available today. This is normal during the off-season —
            the server fetches the schedule automatically each day.
          </p>
        ) : (
          <div className="games-grid">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPlaced={handleBetPlaced}
                onAddToParlay={handleAddToParlay}
              />
            ))}
          </div>
        )}
      </section>

      {/* My bets */}
      <section>
        <h2>My single bets</h2>
        {bets.length === 0 ? (
          <p className="page-hint">You haven't placed any single bets yet.</p>
        ) : (
          <table className="bets-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Type</th>
                <th>Pick</th>
                <th>Stake</th>
                <th>Odds</th>
                <th>To win</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet) => (
                <tr key={bet.id}>
                  <td>
                    {bet.game.awayTeam} @ {bet.game.homeTeam}
                  </td>
                  <td>{BET_LABELS[bet.type]}</td>
                  <td>{bet.pick}</td>
                  <td>€{bet.stake.toFixed(2)}</td>
                  <td>{bet.odds}</td>
                  {/* "To win" = how much this bet pays out if it wins (while pending). */}
                  <td className="potential">
                    {bet.status === "PENDING"
                      ? `€${(bet.stake * bet.odds).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className={`status status-${bet.status.toLowerCase()}`}>
                    {STATUS_LABELS[bet.status] ?? bet.status}
                    {bet.status === "WON" && bet.payout != null && ` (+€${bet.payout.toFixed(2)})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* My parlays */}
      <section>
        <h2>My parlays</h2>
        {parlays.length === 0 ? (
          <p className="page-hint">
            No parlays yet. Open a game, pick a side, hit "Add to parlay", then add a
            second game and place your ticket from the bottom bar.
          </p>
        ) : (
          <table className="bets-table">
            <thead>
              <tr>
                <th>Picks</th>
                <th>Combined odds</th>
                <th>Stake</th>
                <th>To win</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {parlays.map((parlay) => (
                <tr key={parlay.id}>
                  <td>
                    {parlay.legs
                      .map((leg) => `${leg.game.awayTeam} @ ${leg.game.homeTeam} (${BET_LABELS[leg.type]}, ${leg.pick})`)
                      .join(" · ")}
                  </td>
                  <td>{parlay.totalOdds.toFixed(2)}</td>
                  <td>€{parlay.stake.toFixed(2)}</td>
                  {/* "To win" = how much this ticket pays out if it wins (while pending). */}
                  <td className="potential">
                    {parlay.status === "PENDING"
                      ? `€${(parlay.stake * parlay.totalOdds).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className={`status status-${parlay.status.toLowerCase()}`}>
                    {STATUS_LABELS[parlay.status] ?? parlay.status}
                    {parlay.status === "WON" && parlay.payout != null && ` (+€${parlay.payout.toFixed(2)})`}
                    {parlay.status === "PUSH" && ` (€${parlay.payout?.toFixed(2)})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* The bottom bar for building a parlay (only shows while building one). */}
      {parlayPicks.length > 0 && (
        <ParlaySlip picks={parlayPicks} onRemove={handleRemovePick} onPlace={handlePlaceParlay} />
      )}
    </div>
  );
}