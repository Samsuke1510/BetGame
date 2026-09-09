// -----------------------------------------------------------------------------
// api.ts — the single place the mobile app talks to the backend
// -----------------------------------------------------------------------------
// Same functions and same API as the web app's api.ts, but pointed at the real
// backend address (see config.ts) and saving the login token in AsyncStorage
// (React Native's version of the browser's localStorage).
// -----------------------------------------------------------------------------

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "./config";
import type { AuthResponse, Bet, Game, Parlay, User } from "./types";

// Create one axios instance pre-configured for our API.
const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

// Send the saved login token on every request, if we have one. AsyncStorage is
// the app's tiny permanent storage — it keeps the token between launches so the
// user stays logged in. (AsyncStorage is async, unlike localStorage.)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Auth ----------------------------------------------------------------

export async function register(username: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", { username, password });
  return data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", { username, password });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

// ---- Games ---------------------------------------------------------------

export async function fetchGames(): Promise<Game[]> {
  const { data } = await api.get<Game[]>("/games");
  return data;
}

// ---- Bets ----------------------------------------------------------------

export async function placeBet(payload: { gameId: number; type: string; pick: string; stake: number }): Promise<Bet> {
  const { data } = await api.post<Bet>("/bets", payload);
  return data;
}

export async function fetchBets(): Promise<Bet[]> {
  const { data } = await api.get<Bet[]>("/bets");
  return data;
}

// ---- Parlays -------------------------------------------------------------

export async function placeParlay(legs: { gameId: number; type: string; pick: string }[], stake: number): Promise<Parlay> {
  const { data } = await api.post<Parlay>("/parlays", { legs, stake });
  return data;
}

export async function fetchParlays(): Promise<Parlay[]> {
  const { data } = await api.get<Parlay[]>("/parlays");
  return data;
}