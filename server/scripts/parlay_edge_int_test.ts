// Integration test: parlay A (id 2) LOST via one losing leg; parlay B (id 3)
// WON with a PUSH leg excluded from the odds.
import { prisma } from "../src/db";
import { settleFinishedBets } from "../src/cron/jobs";

async function main() {
  const me = await prisma.user.findUnique({ where: { username: "parlaytest" } });
  console.log("BALANCE BEFORE", me?.balance, "expect 46.839355");

  // Parlay A: game 5 Texas (away) LOST, game 6 Cleveland @ Baltimore total 7 (under WON).
  await prisma.game.update({ where: { id: 5 }, data: { status: "FINAL", awayScore: 3, homeScore: 5, winner: "home" } });
  await prisma.game.update({ where: { id: 6 }, data: { status: "FINAL", awayScore: 4, homeScore: 3 } });

  // Parlay B: game 7 Houston (away) WON; game 8 Mets @ Miami exactly 9 runs → over PUSH.
  await prisma.game.update({ where: { id: 7 }, data: { status: "FINAL", awayScore: 6, homeScore: 2, winner: "away" } });
  await prisma.game.update({ where: { id: 8 }, data: { status: "FINAL", awayScore: 5, homeScore: 4 } });

  await settleFinishedBets();

  const [a, b] = await Promise.all([
    prisma.parlay.findUnique({ where: { id: 2 }, include: { legs: true } }),
    prisma.parlay.findUnique({ where: { id: 3 }, include: { legs: true } }),
  ]);
  console.log("PARLAY A status", a?.status, "payout", a?.payout, "expect LOST null");
  console.log("PARLAY A legs", a?.legs.map((l) => `${l.gameId}:${l.status}`).join(", "), "expect 5:LOST,6:WON");
  console.log("PARLAY B status", b?.status, "payout", b?.payout, "expect WON 7.64 (=4*1.91), PUSH leg excluded");
  console.log("PARLAY B legs", b?.legs.map((l) => `${l.gameId}:${l.status}`).join(", "), "expect 7:WON,8:PUSH");

  const after = await prisma.user.findUnique({ where: { username: "parlaytest" } });
  console.log("BALANCE AFTER", after?.balance, "expect", (46.839355 + 7.64).toFixed(2));
}

main().finally(() => prisma.$disconnect());