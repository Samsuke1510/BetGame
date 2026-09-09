// -----------------------------------------------------------------------------
// cron/jobs.ts — scheduled background tasks ("the daily routine")
// -----------------------------------------------------------------------------
// Every day this file makes sure three things happen automatically:
//
//   1. FETCH   — pull the day's MLB games from the MLB API into our database.
//   2. CREDIT  — give every user their daily €30 top-up.
//   3. SETTLE  — check finished games and pay out any winning bets.
//
// node-cron runs these functions on a schedule. The schedule below runs them
// every minute. That is heavy-handed for production but perfect for fiddling
// with the app now — it means credits appear and bugs get settled quickly.
// A real deployment would run FETCH/CREDIT once a day and SETTLE every few
// minutes. See the comments in startJobs() for exact alternative schedules.
// -----------------------------------------------------------------------------

import cron from "node-cron";
import { prisma } from "../db";
import { DAILY_CREDIT } from "../config";
import { fetchGamesForDate } from "../lib/mlb";
import { evaluateBet } from "../lib/settle";

// Today's date as "YYYY-MM-DD" (what the MLB API expects).
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---- 1. FETCH -----------------------------------------------------------------
// Pull today's games from MLB and save/update them in our database.
export async function fetchTodayGames() {
  const date = today();
  const games = await fetchGamesForDate(date);

  for (const g of games) {
    // "upsert" = UPDATE the row if a game with this gamePk already exists,
    // otherwise CREATE it. This keeps the fetch safe to run repeatedly.
    await prisma.game.upsert({
      where: { gamePk: g.gamePk },
      update: {
        status: g.status,
        awayScore: g.awayScore,
        homeScore: g.homeScore,
        winner: g.winner,
      },
      create: {
        gamePk: g.gamePk,
        awayTeam: g.awayTeam,
        homeTeam: g.homeTeam,
        gameDate: g.gameDate,
        status: g.status,
        awayScore: g.awayScore,
        homeScore: g.homeScore,
        winner: g.winner,
        totalLine: g.totalLine,
        spread: g.spread,
      },
    });
  }

  console.log(`[cron] Fetched ${games.length} MLB game(s) for ${date}`);
}

// ---- 2. CREDIT ----------------------------------------------------------------
// Add the daily €30 to every user's balance, but ONLY once per calendar day.
// We remember the last credit day in the AppState table so calling this job
// every minute is harmless — it simply does nothing until a new day starts.
export async function grantDailyCredit() {
  const date = today();

  // Read (or lazily create) the single AppState row.
  const state = await prisma.appState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Already given today? Nothing to do.
  if (state.lastCreditDay === date) return;

  const result = await prisma.user.updateMany({
    data: { balance: { increment: DAILY_CREDIT } },
  });

  // Record that today's credit has been handed out.
  await prisma.appState.update({ where: { id: 1 }, data: { lastCreditDay: date } });

  console.log(`[cron] Gave €${DAILY_CREDIT} to ${result.count} user(s) for ${date}`);
}

// ---- 3. SETTLE ----------------------------------------------------------------
// Look for bets on games that are now FINAL and pay out the winners.
export async function settleFinishedBets() {
  // Find all pending bets whose game has finished.
  const pendingBets = await prisma.bet.findMany({
    where: { status: "PENDING", game: { status: "FINAL" } },
    include: { game: true },
  });

  for (const bet of pendingBets) {
    const outcome = evaluateBet(bet, bet.game);

    if (outcome === "PUSH") {
      // Tie/refund: give the stake back, mark the bet refunded-friendly as "PUSH".
      await prisma.bet.update({ where: { id: bet.id }, data: { status: "PUSH" } });
      await prisma.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: bet.stake } },
      });
      continue;
    }

    if (outcome === "WON") {
      // Winner: payout = stake * odds. (stake was already deducted, so we add
      // the full return: stake * odds includes the original stake back.)
      const payout = bet.stake * bet.odds;
      await prisma.bet.update({ where: { id: bet.id }, data: { status: "WON", payout } });
      await prisma.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: payout } },
      });
      continue;
    }

    // LOST: stake stays with the "house". Just mark the bet lost.
    await prisma.bet.update({ where: { id: bet.id }, data: { status: "LOST" } });
  }

  if (pendingBets.length > 0) {
    console.log(`[cron] Settled ${pendingBets.length} bet(s)`);
  }
}

// ---- Start the scheduled tasks -------------------------------------------------
// All the individual jobs are exported above so they can also be triggered
// manually (useful for testing). This function wires them up to the clock.
export function startJobs() {
  // Runs every minute — the current "* * * * *" pattern. To run once a day at
  // 06:00 local time you'd change it to "0 6 * * *".
  cron.schedule("* * * * *", async () => {
    try {
      await fetchTodayGames();
      await grantDailyCredit();
      await settleFinishedBets();
    } catch (err) {
      // Never let a background job crash the whole server.
      console.error("[cron] Job failed:", err);
    }
  });

  console.log("[cron] Background jobs scheduled (every minute during dev)");
}