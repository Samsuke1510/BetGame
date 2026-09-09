// -----------------------------------------------------------------------------
// config.ts — central place for all settings/constants
// -----------------------------------------------------------------------------
// Keeping settings here (instead of scattered through the code) means you only
// ever change one spot. Values that are secret or machine-specific (like the
// JWT secret) come from the .env file via process.env.

// The port the backend server listens on.
export const PORT = Number(process.env.PORT) || 4000;

// The secret used to sign login tokens (JWTs). In production this MUST be a
// long random string stored in .env and never committed to git.
export const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";

// How long a login token stays valid before the user has to log in again.
export const JWT_EXPIRES_IN = "7d";

// Virtual money each user is given every day (in euros).
export const DAILY_CREDIT = 30;

// Default betting lines used because the free MLB API provides no real odds.
// A future version could fetch real lines from "The Odds API" instead.
export const DEFAULT_TOTAL_LINE = 9.0; // over/under line (total runs)
export const DEFAULT_SPREAD = -1.5; // favorite must win by more than this

// Betting odds (multipliers). A $1 bet on even odds returns $2 total.
// We keep these simple: -110 style is a real bookmaker concept, but for a
// beginner-friendly virtual app we use clean flat odds.
export const MONEYLINE_ODDS = 1.91; // ~ -110 in American odds
export const OVER_UNDER_ODDS = 1.91;
export const SPREAD_ODDS = 1.91;

// Smallest / largest stake a user can place (sanity limits).
export const MIN_STAKE = 1;
export const MAX_STAKE = 500;

// MLB Stats API base URL. Free, no API key needed.
export const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

// sportId 1 = MLB (Major League Baseball).
export const MLB_SPORT_ID = 1;
