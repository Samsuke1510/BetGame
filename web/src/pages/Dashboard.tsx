// -----------------------------------------------------------------------------
// Dashboard.tsx — the main page after login
// -----------------------------------------------------------------------------
// Three sections: today's games to bet on, the user's bets, and a summary of
// their balance. It fetches games + bets from the server whenever it loads or
// the user refreshes, and asks App to update the balance after placing a bet.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { fetchBets, fetchGames, fetchMe } from "../api";
import GameCard from "../components/GameCard";
import type { Bet, Game, User } from "../types";

interface Props {
  user: User;
  onUserUpdate: (user: User) => void;
}

// Friendly labels + colors for showing bet status.
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
  const [loading, setLoading] = useState(true);

  // Load games and bets from the server. useCallback lets us call refresh from
  // both the initial load and after placing a bet.
  const refresh = useCallback(async () => {
    const [g, b] = await Promise.all([fetchGames(), fetchBets()]);
    setGames(g);
    setBets(b);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // After a bet, reload everything — including the balance from /me so the
  // navbar and summary update with the deducted stake.
  const handleBetPlaced = useCallback(async () => {
    await refresh();
    const me = await fetchMe();
    onUserUpdate(me);
  }, [refresh, onUserUpdate]);

  // Wins/losses totals for the summary panel.
  const won = bets.filter((b) => b.status === "WON").length;
  const lost = bets.filter((b) => b.status === "LOST").length;

  if (loading) return <p className="page-hint">Loading games…</p>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user.username}!</h1>
        <p>Today's MLB games — pick a side and place a virtual bet.</p>
      </header>

      <section className="summary">
        <h2>Your bets</h2>
        <p>
          <strong>Total:</strong> {bets.length} &nbsp;·&nbsp;
          <strong>Won:</strong> {won} &nbsp;·&nbsp;
          <strong>Lost:</strong> {lost}
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
              <GameCard key={game.id} game={game} onPlaced={handleBetPlaced} />
            ))}
          </div>
        )}
      </section>

      {/* My bets */}
      <section>
        <h2>My bets</h2>
        {bets.length === 0 ? (
          <p className="page-hint">You haven't placed any bets yet.</p>
        ) : (
          <table className="bets-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Type</th>
                <th>Pick</th>
                <th>Stake</th>
                <th>Odds</th>
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
    </div>
  );
}