// -----------------------------------------------------------------------------
// routes/games.ts — endpoints for viewing MLB games
// -----------------------------------------------------------------------------
//   GET /api/games?date=YYYY-MM-DD -> games for a date (defaults to today)
// -----------------------------------------------------------------------------

import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

export const gamesRouter = Router();

// GET /api/games
gamesRouter.get("/", requireAuth, async (req, res) => {
  // Allow ?date=... to look at another day, otherwise use today's date.
  // We build the date string in the same local timezone format the MLB API wants.
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);

  // Read games for that date from our database. Games are stored there by the
  // daily cron job (see cron/jobs.ts) which pulls them from the MLB API.
  const games = await prisma.game.findMany({
    where: { gameDate: date },
    orderBy: { id: "asc" },
  });

  res.json(games);
});
