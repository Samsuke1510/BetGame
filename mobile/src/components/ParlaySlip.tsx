// -----------------------------------------------------------------------------
// ParlaySlip.tsx — the bottom bar that builds a parlay before you submit it
// -----------------------------------------------------------------------------
// The mobile twin of the web's sticky parlay slip. Shows every pick you've
// added, the COMBINED odds (each leg's odds multiplied — that's what makes
// parlays risky and exciting), a stake input with the potential win, and the
// button to submit the whole ticket.
// -----------------------------------------------------------------------------

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../theme";
import type { ParlayPick } from "../types";

interface Props {
  picks: ParlayPick[];
  onRemove: (gameId: number) => void;
  onPlace: (legs: { gameId: number; type: string; pick: string }[], stake: number) => Promise<string | null>;
}

export default function ParlaySlip({ picks, onRemove, onPlace }: Props) {
  const insets = useSafeAreaInsets();
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
    <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Parlay slip</Text>
        <Text style={styles.combined}>
          Combined odds: <Text style={styles.combinedStrong}>{combinedOdds.toFixed(2)}</Text>
        </Text>
      </View>

      {/* The picks, with a ✕ to remove each one. */}
      <ScrollView style={styles.picksList} nestedScrollEnabled>
        {picks.map((pick) => (
          <View key={pick.gameId} style={styles.pickRow}>
            <Pressable onPress={() => onRemove(pick.gameId)} hitSlop={10}>
              <Text style={styles.remove}>✕</Text>
            </Pressable>
            <Text style={styles.pickLabel} numberOfLines={1}>
              {pick.label}
            </Text>
            <Text style={styles.pickOdds}>{pick.odds}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footerRow}>
        <View style={styles.stakeCol}>
          <Text style={styles.stakeLabel}>Stake (€)</Text>
          <TextInput
            style={styles.stakeInput}
            keyboardType="numeric"
            value={stake}
            onChangeText={setStake}
            placeholder="e.g. 5"
            placeholderTextColor={colors.textDim}
          />
        </View>

        <View style={styles.rightCol}>
          {stakeNum > 0 && (
            <Text style={styles.potential}>To win: €{potential.toFixed(2)}</Text>
          )}
          <Pressable
            style={[styles.place, busy && styles.placeDisabled]}
            onPress={handlePlace}
            disabled={busy}
          >
            <Text style={styles.placeText}>{busy ? "Placing…" : "Place parlay"}</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderTopWidth: 3,
    borderTopColor: colors.primary, // blue accent line on top
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.amberText,
  },
  combined: {
    color: colors.textMuted,
    fontSize: 13,
  },
  combinedStrong: {
    color: colors.amberText,
    fontWeight: "700",
  },
  picksList: {
    maxHeight: 130,
    marginTop: 8,
  },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  remove: {
    color: colors.red,
    fontSize: 15,
  },
  pickLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  pickOdds: {
    color: colors.textMuted,
    fontSize: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginTop: 10,
  },
  stakeCol: {
    flex: 1,
  },
  stakeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  stakeInput: {
    backgroundColor: colors.inputBg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 9,
    color: colors.text,
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  potential: {
    color: colors.green,
    fontWeight: "600",
    fontSize: 13,
  },
  place: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  placeDisabled: { opacity: 0.7 },
  placeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  error: {
    color: colors.red,
    fontSize: 12,
    marginTop: 6,
  },
  success: {
    color: colors.green,
    fontSize: 12,
    marginTop: 6,
  },
});