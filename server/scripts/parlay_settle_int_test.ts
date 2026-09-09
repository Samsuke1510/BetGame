// Integration test: simulate finished games and run the real cron settle.
// Updates games 2 (Toronto away), 3 (St. Louis over), 4 (SD home) to FINAL
// with results that make every leg of parlay #1 WON, then runs settleFinishedBets.
import { prisma } from "../src/db";
import { settleFinishedBets } from "../src/cron/jobs";

async function main() {
  // Before: show the pending parlay and balance.
  const me = await prisma.user.findUnique({ where: { username: "parlaytest" } });
  console.log("BALANCE BEFORE", me?.balance);

  // Game 2: Toronto (away) wins 4-3 → MONEYLINE away WON.
  await prisma.game.update({ where: { id: 2 }, data: { status: "FINAL", awayScore: 4, homeScore: 3, winner: "away" } });
  // Game 3: total 11 runs (> 9.0 line) → OVER WON. Winner irrelevant.
  await prisma.game.update({ where: { id: 3 }, data: { status: "FINAL", awayScore: 6, homeScore: 5 } });
  // Game 4: San Diego (home) wins by 2+ → SPREAD home WON (-1.5 covered).
  await prisma.game.update({ where: { id: 4 }, data: { status: "FINAL", awayScore: 2, homeScore: 5, winner: "home" } });

  await settleFinishedBets();

  const parlay = await prisma.parlay.findUnique({ where: { id: 1 }, include: { legs: true } });
  console.log("PARLAY status", parlay?.status, "payout", parlay?.payout, "expected WON 34.839355");
  console.log("LEGS", parlay?.legs.map((l) => `${l.gameId}:${l.status}`).join(", "), "expected 2:WON,3:WON,4:WON");

  const after = await prisma.user.findUnique({ where: { username: "parlaytest" } });
  console.log("BALANCE AFTER", after?.balance, "expected 20 + 34.839355 =", (20 + 34.839355).toFixed(2));
}

main().finally(() => prisma.$disconnect());