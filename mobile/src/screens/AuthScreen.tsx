// -----------------------------------------------------------------------------
// AuthScreen.tsx — the login / register screen
// -----------------------------------------------------------------------------
// One screen for both actions (a small toggle switches between them). On
// success we save the token (AsyncStorage) and tell App which user logged in,
// so it can swap this screen for the Dashboard.
// -----------------------------------------------------------------------------

import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, register } from "../api";
import { colors } from "../theme";
import type { User } from "../types";

interface Props {
  onAuth: (user: User) => void; // called once logged in / registered
}

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!username.trim() || !password) {
      setError("Enter a username and a password");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Register also creates the account; login only checks the password.
      const { token, user } =
        mode === "login" ? await login(username, password) : await register(username, password);
      await AsyncStorage.setItem("token", token);
      onAuth(user);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Center the little card on the navy background. */}
      <View style={styles.page}>
        <Text style={styles.brand}>⚾ BetGame</Text>
        <Text style={styles.tagline}>Virtual MLB betting — play with €30 a day</Text>

        <View style={styles.card}>
          <Text style={styles.title}>{isLogin ? "Log in" : "Create an account"}</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="e.g. betty"
            placeholderTextColor={colors.textDim}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textDim}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}
            onPress={handleSubmit}
            disabled={busy}
          >
            <Text style={styles.submitText}>{busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}</Text>
          </Pressable>

          {/* Toggle between the two modes. */}
          <Pressable onPress={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>
            <Text style={styles.switch}>
              {isLogin ? "No account yet? Create one" : "Already have an account? Log in"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  brand: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.amberText,
    marginBottom: 6,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 28,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 11,
    color: colors.text,
  },
  error: {
    color: colors.red,
    fontSize: 13,
    marginTop: 4,
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitPressed: { opacity: 0.85 },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  switch: {
    color: "#60a5fa",
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
  },
});