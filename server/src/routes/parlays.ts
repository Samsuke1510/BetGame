// -----------------------------------------------------------------------------
// routes/parlays.ts — endpoints for parlay tickets (multiple picks combined)
// -----------------------------------------------------------------------------
//   POST /api/parlays -> create a parlay from 2+ picks on DIFFERENT games
//                        (deducts one stake, computes the combined odds)
//   GET  /api/parlays -> list the logged-in user's parlays
// -----------------------------------------------------------------------------

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { VALID_PICKS } from "./bets";
import { MAX_STAKE, MIN_STAKE, MONEYLINE_ODDS, OVER_UNDER_ODDS, SPREAD_ODDS, PARLAY_MIN_LEGS, PARLAY_MAX_LEGS } from "../config";

export const parlaysRouter = Router();

// A parlay leg is just "pick a side of a game" — the stake is for the whole ticket.
const legSchema = z.object({
  gameId: z.number().int().positive(),
  type: z.enum(["MONEYLINE", "OVER_UNDER", "SPREAD"]),
  pick: z.string(),
});

const parlaySchema = z.object({
  legs: z.array(legSchema).min(PARLAY_MIN_LEGS, `A parlay needs at least ${PARLAY_MIN_LEGS} picks`).max(PARLAY_MAX_LEGS, `A parlay can have at most ${PARLAY_MAX_LEGS} picks`),
  stake: z.number().min(MIN_STAKE, `Minimum stake is ${MIN_STAKE}`).max(MAX_STAKE, `Maximum stake is ${MAX_STAKE}`),
});

// POST /api/parlays
parlaysRouter.post("/", requireAuth, async (req, res) => {
  // 1. Validate the shape of the request.
  const parsed = parlaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { legs, stake } = parsed.data;

  // 2. Check every pick is allowed for its bet type.
  for (const leg of legs) {
    if (!VALID_PICKS[leg.type].includes(leg.pick)) {
      res.status(400).json({ error: `Invalid pick "${leg.pick}" for bet type ${leg.type}` });
      return;
    }
  }

  // 3. All legs must be on DIFFERENT games (that's what makes a parlay).
  const uniqueGameIds = new Set(legs.map((leg) => leg.gameId));
  if (uniqueGameIds.size !== legs.length) {
    res.status(400).json({ error: "Every parlay leg must be on a different game" });
    return;
  }

  // 4. Load the games and make sure they all exist and are still open.
  const gameIds = [...uniqueGameIds];
  const games = await prisma.game.findMany({ where: { id: { in: gameIds } } });
  if (games.length !== gameIds.length) {
    res.status(404).json({ error: "One or more games were not found" });
    return;
  }
  if (games.some((game) => game.status === "FINAL")) {
    res.status(400).json({ error: "Betting is closed for one or more games" });
    return;
  }

  // 5. Check the user has enough balance for the single ticket stake.
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  if (user.balance < stake) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  // 6. Give each leg its odds, and combine them by multiplying (1.91 × 1.91 × …).
  const oddsMap: Record<string, number> = {
    MONEYLINE: MONEYLINE_ODDS,
    OVER_UNDER: OVER_UNDER_ODDS,
    SPREAD: SPREAD_ODDS,
  };
  const totalOdds = legs.reduce((product, leg) => product * oddsMap[leg.type], 1);

  // 7. Create the Parlay + its Bet legs + deduct the stake. Everything happens
  //    in ONE transaction so it can't be half-done.
  const parlay = await prisma.$transaction(async (tx) => {
    const created = await tx.parlay.create({
      data: { userId: user.id, stake, totalOdds, legs: { create: legs.map((leg) => ({ userId: user.id, gameId: leg.gameId, type: leg.type, pick: leg.pick, stake, odds: oddsMap[leg.type] })) } },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { balance: { decrement: stake } },
    });
    return created;
  });

  // 8. Return the ticket with its legs and games filled in for the UI.
  const full = await prisma.parlay.findUnique({
    where: { id: parlay.id },
    include: { legs: { include: { game: true } } },
  });
  res.status(201).json(full);
});

// GET /api/parlays — the user's tickets, newest first.
parlaysRouter.get("/", requireAuth, async (req, res) => {
  const parlays = await prisma.parlay.findMany({
    where: { userId: req.user!.id },
    include: { legs: { include: { game: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(parlays);
});