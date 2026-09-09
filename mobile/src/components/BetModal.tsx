// -----------------------------------------------------------------------------
// BetModal.tsx — the popup where the user builds and places a bet
// -----------------------------------------------------------------------------
// Given a game and a bet type, it shows the available pick buttons, a stake
// input with a live "you could win" preview, and submits to the server. The
// parent is responsible for re-fetching data after a successful bet.
// -----------------------------------------------------------------------------

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { placeBet } from "../api";
import { colors } from "../theme";
import type { Game } from "../types";

// Matches the server's flat odds.
const ODDS = 1.91;

interface Props {
  game: Game;
  betType: string;
  onClose: () => void;
  onPlaced?: () => void; // callback after a successful bet
  onAddToParlay?: (pick: { gameId: number; type: string; pick: string }) => void;
}

export default function BetModal({ game, betType, onClose, onPlaced, onAddToParlay }: Props) {
  // The currently-selected pick and the stake the user types in.
  const [pick, setPick] = useState<string | null>(null);
  const [stake, setStake] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const stakeNum = Number(stake);
  const potential = stakeNum > 0 ? stakeNum * ODDS : 0;

  // The two buttons shown for this bet type, labelled with real team names /
  // line numbers from the game.
  const options =
    betType === "MONEYLINE"
      ? [
          { value: "away", label: game.awayTeam },
          { value: "home", label: game.homeTeam },
        ]
      : betType === "OVER_UNDER"
        ? [
            { value: "over", label: `Over ${game.totalLine}` },
            { value: "under", label: `Under ${game.totalLine}` },
          ]
        : [
            { value: "home", label: `Home ${game.spread}` },
            { value: "away", label: `Away +${-game.spread}` },
          ];

  async function handleSubmit() {
    if (!pick) {
      setError("Pick a side first");
      return;
    }
    setBusy(true);
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
    } finally {
      setBusy(false);
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
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      {/* Backdrop: pressing outside the card closes the modal. */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* This inner Pressable "claims" the touch so taps inside don't close it. */}
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.title}>{betType.replace("_", " ")} bet</Text>
            <Text style={styles.matchup}>
              {game.awayTeam} @ {game.homeTeam}
            </Text>

            {/* The pick buttons side by side. */}
            <View style={styles.pickRow}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.pickBtn, pick === opt.value && styles.pickBtnSelected]}
                  onPress={() => setPick(opt.value)}
                >
                  <Text style={[styles.pickBtnText, pick === opt.value && styles.pickBtnTextSelected]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Stake (€)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={stake}
              onChangeText={setStake}
              placeholder="e.g. 5"
              placeholderTextColor={colors.textDim}
            />

            {stakeNum > 0 && (
              <Text style={styles.potential}>Potential win: €{potential.toFixed(2)}</Text>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {success ? <Text style={styles.success}>{success}</Text> : null}

            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnOutline]} onPress={onClose}>
                <Text style={styles.btnOutlineText}>Cancel</Text>
              </Pressable>
              {/* Only show "Add to parlay" when the Dashboard wired up the handler. */}
              {onAddToParlay && (
                <Pressable style={[styles.btn, styles.btnGhost]} onPress={handleAddToParlay}>
                  <Text style={styles.btnGhostText}>Add to parlay</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.btn, styles.btnPrimary, busy && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={busy}
              >
                <Text style={styles.btnPrimaryText}>{busy ? "Placing…" : "Place bet"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  matchup: {
    color: colors.textMuted,
    fontSize: 13,
  },
  pickRow: {
    flexDirection: "row",
    gap: 8,
  },
  pickBtn: {
    flex: 1,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.inputBg,
    alignItems: "center",
  },
  pickBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickBtnText: {
    color: colors.text,
    fontSize: 13,
    textAlign: "center",
  },
  pickBtnTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 11,
    color: colors.text,
  },
  potential: {
    color: colors.green,
    fontWeight: "600",
    fontSize: 14,
  },
  error: {
    color: colors.red,
    fontSize: 13,
  },
  success: {
    color: colors.green,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  btn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderColor: colors.cardBorder,
    borderWidth: 1,
  },
  btnOutlineText: { color: colors.text },
  btnGhost: {
    backgroundColor: colors.ghost,
  },
  btnGhostText: { color: colors.text, fontWeight: "600" },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "600" },
  btnDisabled: { opacity: 0.7 },
});