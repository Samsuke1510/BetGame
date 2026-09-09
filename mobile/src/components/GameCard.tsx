// -----------------------------------------------------------------------------
// GameCard.tsx — one card showing a single MLB game + its bet buttons
// -----------------------------------------------------------------------------
// The mobile twin of the web GameCard: colored by the two teams' brand colors,
// shows the start time in Paris time, the final score once the game is over,
// and the three buttons that open the bet popup.
// -----------------------------------------------------------------------------

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Game, ParlayPick } from "../types";
import { teamColor } from "../data/teamColors";
import { formatGameTime } from "../utils/date";
import { colors } from "../theme";
import BetModal from "./BetModal";

// Flat odds used across the app for every bet (matches the server config).
const LEG_ODDS = 1.91;

// Fancy names for the three bet types, shown to the user.
const BET_TYPE_LABELS: Record<string, string> = {
  MONEYLINE: "Win / Loss",
  OVER_UNDER: "Over / Under",
  SPREAD: "Point Spread",
};

interface Props {
  game: Game;
  onPlaced?: () => void; // called when a bet on this game is placed
  onAddToParlay?: (pick: ParlayPick) => void; // called to add a pick to the slip
}

export default function GameCard({ game, onPlaced, onAddToParlay }: Props) {
  // Which bet type, if any, the modal should show. null = closed.
  const [modalType, setModalType] = useState<string | null>(null);

  const isFinal = game.status === "FINAL";
  const score = isFinal ? `${game.awayScore} - ${game.homeScore}` : "";

  const awayColor = teamColor(game.awayTeam);
  const homeColor = teamColor(game.homeTeam);

  // Turn a raw pick (from the modal) into a friendly ParlayPick for the slip.
  function handleAddToParlay(plain: { gameId: number; type: string; pick: string }) {
    if (!onAddToParlay) return;

    let label: string;
    if (plain.type === "MONEYLINE") {
      label = `${plain.pick === "home" ? game.homeTeam : game.awayTeam} to win`;
    } else if (plain.type === "OVER_UNDER") {
      label = `${plain.pick === "over" ? "Over" : "Under"} ${game.totalLine}`;
    } else {
      label = plain.pick === "home" ? `${game.homeTeam} ${game.spread}` : `${game.awayTeam} +${-game.spread}`;
    }

    onAddToParlay({ gameId: game.id, type: plain.type, pick: plain.pick, odds: LEG_ODDS, label });
  }

  return (
    <View style={styles.card}>
      {/* Top stripe: a gradient-like blend of away color (left) into home (right). */}
      <View style={styles.stripe}>
        <View style={[styles.stripeHalf, { backgroundColor: awayColor }]} />
        <View style={[styles.stripeHalf, { backgroundColor: homeColor }]} />
      </View>

      {/* Matchup: colored team names with a colored dot, score on the right. */}
      <View style={styles.teamsRow}>
        <Text style={[styles.team, { color: awayColor }]}>● {game.awayTeam}</Text>
        <Text style={styles.at}>@</Text>
        <Text style={[styles.team, { color: homeColor }]}>● {game.homeTeam}</Text>
        {isFinal && <Text style={styles.score}>{score}</Text>}
      </View>

      {/* Meta row: start time (Paris) + the betting lines. */}
      <View style={styles.metaRow}>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>🕐 {formatGameTime(game.gameTime)}</Text>
        </View>
        <Text style={styles.lines}>
          Total {game.totalLine} · Home {game.spread}
        </Text>
      </View>

      {/* The bet buttons (hidden once the game is final). */}
      <View style={styles.buttonsRow}>
        {isFinal ? (
          <Text style={styles.final}>Game finished</Text>
        ) : (
          Object.entries(BET_TYPE_LABELS).map(([type, label]) => (
            <Pressable
              key={type}
              style={({ pressed }) => [styles.betBtn, pressed && styles.betBtnPressed]}
              onPress={() => setModalType(type)}
            >
              <Text style={styles.betBtnText}>{label}</Text>
            </Pressable>
          ))
        )}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingBottom: 14,
    overflow: "hidden",
    marginBottom: 14,
  },
  stripe: {
    flexDirection: "row",
    height: 5,
  },
  stripeHalf: {
    flex: 1,
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  team: {
    fontWeight: "700",
    fontSize: 15,
  },
  at: {
    color: colors.textDim,
  },
  score: {
    marginLeft: "auto",
    fontWeight: "800",
    fontSize: 16,
    color: colors.amberText,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  timeBadge: {
    backgroundColor: colors.amberSoft,
    borderColor: "rgba(245, 158, 11, 0.35)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  timeText: {
    color: colors.amberText,
    fontSize: 12,
    fontWeight: "600",
  },
  lines: {
    color: colors.textMuted,
    fontSize: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  betBtn: {
    flex: 1,
    backgroundColor: colors.ghost,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: "center",
  },
  betBtnPressed: {
    backgroundColor: colors.hover,
  },
  betBtnText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  final: {
    color: colors.textDim,
    fontSize: 13,
    paddingVertical: 8,
  },
});