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
  gameDate: string;
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