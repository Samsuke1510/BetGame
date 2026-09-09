// -----------------------------------------------------------------------------
// api.ts — the single place the web app talks to the backend
// -----------------------------------------------------------------------------
// We use "axios", a popular library for making HTTP requests from the browser.
// Every function here returns the data our app needs, and automatically adds
// the login token to each request so the server knows who we are.
// -----------------------------------------------------------------------------

import axios from "axios";
import type { AuthResponse, Bet, Game, User } from "./types";

// Create one axios instance pre-configured for our API.
const api = axios.create({ baseURL: "/api" });

// Send the saved login token on every request, if we have one. localStorage is
// the browser's tiny permanent storage — a place to keep the token between
// refreshes so the user stays logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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