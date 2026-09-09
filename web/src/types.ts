// -----------------------------------------------------------------------------
// types.ts — TypeScript shapes shared across the web app
// -----------------------------------------------------------------------------
// These mirror the data coming back from our backend server. Defining them once
// means the editor can auto-complete field names and catch typos for us.

// A logged-in user.
export interface User {
  id: number;
  username: string;
  balance: number;
}

// One MLB game, as returned by GET /api/games.
export interface Game {
  id: number;
  gamePk: number;
  awayTeam: string;
  homeTeam: string;
  gameDate: string; // "2026-09-09"
  gameTime: string; // full start time, ISO UTC string (displayed in Paris time)
  status: string; // "SCHEDULED" | "FINAL"
  awayScore: number | null;
  homeScore: number | null;
  totalLine: number;
  spread: number;
  winner: string | null; // "away" | "home" | null
}

// A user's bet, with the game it was placed on included.
export interface Bet {
  id: number;
  type: "MONEYLINE" | "OVER_UNDER" | "SPREAD";
  pick: string; // "away" | "home" | "over" | "under"
  stake: number;
  odds: number;
  status: string; // "PENDING" | "WON" | "LOST" | "PUSH"
  payout: number | null;
  createdAt: string;
  game: Game;
}

// Response shape of register/login endpoints.
export interface AuthResponse {
  token: string;
  user: User;
}

// One leg (pick) of a parlay — a Bet that belongs to a Parlay.
export interface ParlayLeg {
  id: number;
  type: "MONEYLINE" | "OVER_UNDER" | "SPREAD";
  pick: string;
  odds: number;
  status: string; // "PENDING" | "WON" | "LOST" | "PUSH"
  game: Game;
}

// A parlay ticket: several legs combined for multiplied odds.
export interface Parlay {
  id: number;
  stake: number;
  totalOdds: number;
  status: string; // "PENDING" | "WON" | "LOST" | "PUSH"
  payout: number | null;
  createdAt: string;
  legs: ParlayLeg[];
}

// A pick the user has added to the in-progress parlay slip (not yet submitted).
export interface ParlayPick {
  gameId: number;
  type: string;
  pick: string;
  odds: number;
  label: string; // short human description, e.g. "Twins to win"
}