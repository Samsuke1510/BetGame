// -----------------------------------------------------------------------------
// routes/bets.ts — endpoints for placing and listing bets
// -----------------------------------------------------------------------------
//   POST /api/bets  -> place a new bet (deducts stake from balance)
//   GET  /api/bets  -> list the logged-in user's bets
// -----------------------------------------------------------------------------

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { MAX_STAKE, MIN_STAKE, MONEYLINE_ODDS, OVER_UNDER_ODDS, SPREAD_ODDS } from "../config";

export const betsRouter = Router();

// Allowed pick values for each bet type, used for validation.
const VALID_PICKS: Record<string, string[]> = {
  MONEYLINE: ["away", "home"],
  OVER_UNDER: ["over", "under"],
  SPREAD: ["away", "home"],
};

const betSchema = z.object({
  gameId: z.number().int().positive(),
  type: z.enum(["MONEYLINE", "OVER_UNDER", "SPREAD"]),
  pick: z.string(),
  stake: z.number().min(MIN_STAKE, `Minimum stake is ${MIN_STAKE}`).max(MAX_STAKE, `Maximum stake is ${MAX_STAKE}`),
});

// POST /api/bets
betsRouter.post("/", requireAuth, async (req, res) => {
  // 1. Validate the input shape.
  const parsed = betSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { gameId, type, pick, stake } = parsed.data;

  // 2. Check the pick is valid for this bet type.
  if (!VALID_PICKS[type].includes(pick)) {
    res.status(400).json({ error: `Invalid pick "${pick}" for bet type ${type}` });
    return;
  }

  // 3. Load the game and check it exists and is still open for betting.
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (game.status === "FINAL") {
    res.status(400).json({ error: "Game already finished, betting is closed" });
    return;
  }

  // 4. Load the user fresh from the DB to get their current balance.
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  if (user.balance < stake) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  // 5. Set the odds based on bet type (flat odds from config).
  const oddsMap: Record<string, number> = {
    MONEYLINE: MONEYLINE_ODDS,
    OVER_UNDER: OVER_UNDER_ODDS,
    SPREAD: SPREAD_ODDS,
  };
  const odds = oddsMap[type];

  // 6. Create the bet and deduct the stake, in a single atomic transaction so
  //    both always happen together — no chance of a bet without a deduction.
  const bet = await prisma.$transaction(async (tx) => {
    const created = await tx.bet.create({
      data: { userId: user.id, gameId, type, pick, stake, odds },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: stake } },
    });
    return created;
  });

  res.status(201).json(bet);
});

// GET /api/bets — return the user's bets with their game info filled in.
betsRouter.get("/", requireAuth, async (req, res) => {
  const bets = await prisma.bet.findMany({
    where: { userId: req.user!.id },
    include: { game: true }, // also fetch the related game for display
    orderBy: { createdAt: "desc" },
  });
  res.json(bets);
});
