// -----------------------------------------------------------------------------
// mlb.ts — talking to the free MLB Stats API
// -----------------------------------------------------------------------------
// MLB publishes a free, no-key API at statsapi.mlb.com. We use it to fetch
// the day's schedule. We also generate simple "betting lines" here because the
// MLB API does NOT provide real odds — so over/under and spread bets need
// default lines to work. (A future version could use "The Odds API" for real
// lines; this is a clean virtual-mock for now.)

import { MLB_API_BASE, MLB_SPORT_ID, DEFAULT_TOTAL_LINE, DEFAULT_SPREAD } from "../config";

// A minimal, friendly shape of one MLB game that our app cares about.
export interface FetchedGame {
  gamePk: number;
  awayTeam: string;
  homeTeam: string;
  gameDate: string; // plain date, e.g. "2026-09-09" (used for filtering)
  gameTime: string; // full start time as an ISO string in UTC (shown in Paris time)
  awayScore: number | null;
  homeScore: number | null;
  status: "SCHEDULED" | "FINAL";
  winner: "away" | "home" | null;
  totalLine: number; // over/under line
  spread: number; // home-team spread
}

// Fetch today's games from the MLB schedule endpoint and map them into our shape.
// Returns an array (possibly empty during the MLB off-season).
export async function fetchGamesForDate(date: string): Promise<FetchedGame[]> {
  // URL for the MLB schedule for one day.
  const url = `${MLB_API_BASE}/schedule?sportId=${MLB_SPORT_ID}&date=${date}`;

  const res = await fetch(url);
  if (!res.ok) {
    // If MLB is unreachable, log and return nothing rather than crashing.
    console.warn(`MLB API error: ${res.status}`);
    return [];
  }

  const data: any = await res.json();
  // The API nests games under data.dates[0].games. If there are no games for
  // the day, dates is empty — we guard against that below.
  const games = data?.dates?.[0]?.games ?? [];

  return games.map((g: any) => {
    const away = g.teams.away;
    const home = g.teams.home;

    // MLB's "gameDate" is the full UTC start time (e.g. "2026-09-09T17:10:00Z");
    // "officialDate" is the venue's local calendar date. We keep both:
    //   gameDate -> the date, used to group games by day
    //   gameTime -> the exact UTC time, displayed to users as Paris time
    const gameTime = g.gameDate;
    const isFinal = g.status?.abstractGameState === "Final";

    // Decide the winner from the score, if we have a final score.
    let winner: "away" | "home" | null = null;
    if (isFinal && away.score != null && home.score != null) {
      winner = away.score > home.score ? "away" : "home";
    }

    return {
      gamePk: g.gamePk,
      awayTeam: away.team.name,
      homeTeam: home.team.name,
      gameDate: date,
      gameTime,
      awayScore: isFinal ? away.score : null,
      homeScore: isFinal ? home.score : null,
      status: isFinal ? "FINAL" : "SCHEDULED",
      winner,
      // Default betting lines (see file header comment).
      totalLine: DEFAULT_TOTAL_LINE,
      spread: DEFAULT_SPREAD,
    };
  });
}
