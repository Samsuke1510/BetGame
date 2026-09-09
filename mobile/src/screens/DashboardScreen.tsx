// -----------------------------------------------------------------------------
// DashboardScreen.tsx — the main screen after login
// -----------------------------------------------------------------------------
// Sections: today's games to bet on (single or add-to-parlay), the parlay slip
// (sticky bottom bar), the user's single bets, and their parlay tickets. It
// fetches from the server on load, and asks App to update the balance after any
// bet. The mobile twin of the web Dashboard.
// -----------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GameCard from "../components/GameCard";
import ParlaySlip from "../components/ParlaySlip";
import { fetchBets, fetchGames, fetchMe, fetchParlays, placeParlay as placeParlayApi } from "../api";
import { colors } from "../theme";
import type { Bet, Game, Parlay, ParlayPick, User } from "../types";

interface Props {
  user: User;
  onUserUpdate: (user: User) => void;
  onLogout: () => void;
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

// Green for wins, red for losses, amber for pending, grey for pushes.
function statusColor(status: string) {
  switch (status) {
    case "WON":
      return colors.green;
    case "LOST":
      return colors.red;
    case "PUSH":
      return colors.textMuted;
    default:
      return colors.amberText; // PENDING
  }
}

export default function DashboardScreen({ user, onUserUpdate, onLogout }: Props) {
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

  // Wins/losses totals for the summary line.
  const won = bets.filter((b) => b.status === "WON").length;
  const lost = bets.filter((b) => b.status === "LOST").length;

  return (
    <View style={styles.flex}>
      {/* Top header: brand + balance + logout (like the web navbar). */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.brand}>⚾ BetGame</Text>
        <View style={styles.headerRight}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.balance}>€{user.balance.toFixed(2)}</Text>
          <Pressable style={styles.logout} onPress={onLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.flex}>
        {/* Extra bottom padding while the parlay slip bar is shown. */}
        <ScrollView contentContainerStyle={[styles.content, parlayPicks.length > 0 && styles.contentWithSlip]}>
          {/* Greeting */}
          <Text style={styles.greeting}>Welcome, {user.username}!</Text>
          <Text style={styles.subtitle}>
            Today's MLB games — pick a side, place a single bet, or build a parlay.
          </Text>

          {/* Small activity summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              <Text style={styles.summaryStrong}>{bets.length}</Text> bets ·{" "}
              <Text style={styles.summaryStrong}>{won}</Text> won ·{" "}
              <Text style={styles.summaryStrong}>{lost}</Text> lost ·{" "}
              <Text style={styles.summaryStrong}>{parlays.length}</Text> parlays
            </Text>
          </View>

          {/* Today's games */}
          <Text style={styles.sectionTitle}>Today's games</Text>
          {loading ? (
            <Text style={styles.hint}>Loading games…</Text>
          ) : games.length === 0 ? (
            <Text style={styles.hint}>
              No MLB games available today. This is normal during the off-season — the
              server fetches the schedule automatically each day.
            </Text>
          ) : (
            games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPlaced={handleBetPlaced}
                onAddToParlay={handleAddToParlay}
              />
            ))
          )}

          {/* My single bets */}
          <Text style={styles.sectionTitle}>My single bets</Text>
          {bets.length === 0 ? (
            <Text style={styles.hint}>You haven't placed any single bets yet.</Text>
          ) : (
            bets.map((bet) => (
              <View key={bet.id} style={styles.row}>
                <Text style={styles.rowTitle}>
                  {bet.game.awayTeam} @ {bet.game.homeTeam}
                </Text>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowInfo}>
                    {BET_LABELS[bet.type]} · {bet.pick} · €{bet.stake.toFixed(2)} @ {bet.odds}
                  </Text>
                  {/* "To win" only while the bet is still pending. */}
                  <Text style={styles.rowToWin}>
                    {bet.status === "PENDING"
                      ? `To win: €${(bet.stake * bet.odds).toFixed(2)}`
                      : "To win: —"}
                  </Text>
                  <Text style={[styles.rowStatus, { color: statusColor(bet.status) }]}>
                    {STATUS_LABELS[bet.status] ?? bet.status}
                    {bet.status === "WON" && bet.payout != null && ` (+€${bet.payout.toFixed(2)})`}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* My parlays */}
          <Text style={styles.sectionTitle}>My parlays</Text>
          {parlays.length === 0 ? (
            <Text style={[styles.hint, styles.lastHint]}>
              No parlays yet. Open a game, pick a side, tap "Add to parlay", then add a
              second game and place your ticket from the bottom bar.
            </Text>
          ) : (
            parlays.map((parlay) => (
              <View key={parlay.id} style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {parlay.legs
                    .map((leg) => `${leg.game.awayTeam} @ ${leg.game.homeTeam} (${BET_LABELS[leg.type]}, ${leg.pick})`)
                    .join(" · ")}
                </Text>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowInfo}>
                    Odds {parlay.totalOdds.toFixed(2)} · €{parlay.stake.toFixed(2)}
                  </Text>
                  <Text style={styles.rowToWin}>
                    {parlay.status === "PENDING"
                      ? `To win: €${(parlay.stake * parlay.totalOdds).toFixed(2)}`
                      : "To win: —"}
                  </Text>
                  <Text style={[styles.rowStatus, { color: statusColor(parlay.status) }]}>
                    {STATUS_LABELS[parlay.status] ?? parlay.status}
                    {parlay.status === "WON" && parlay.payout != null && ` (+€${parlay.payout.toFixed(2)})`}
                    {parlay.status === "PUSH" && ` (€${parlay.payout?.toFixed(2)})`}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* The sticky bottom bar for building a parlay (only while building one). */}
        {parlayPicks.length > 0 && (
          <ParlaySlip picks={parlayPicks} onRemove={handleRemovePick} onPlace={handlePlaceParlay} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  brand: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.amberText,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  username: {
    color: colors.textMuted,
    fontSize: 13,
  },
  balance: {
    color: colors.green,
    fontWeight: "700",
    fontSize: 15,
  },
  logout: {
    backgroundColor: colors.ghost,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutText: {
    color: colors.text,
    fontSize: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  contentWithSlip: {
    paddingBottom: 320, // make room for the absolute parlay slip bar
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  summary: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryStrong: {
    color: colors.text,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 22,
    marginBottom: 10,
  },
  hint: {
    color: colors.textMuted,
    fontStyle: "italic",
    fontSize: 13,
  },
  lastHint: {
    marginBottom: 16,
  },
  row: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rowTitle: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  rowMeta: {
    marginTop: 6,
    gap: 3,
  },
  rowInfo: {
    color: colors.textMuted,
    fontSize: 12,
  },
  rowToWin: {
    color: colors.green,
    fontWeight: "700",
    fontSize: 12,
  },
  rowStatus: {
    fontWeight: "600",
    fontSize: 12,
  },
});