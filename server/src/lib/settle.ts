// -----------------------------------------------------------------------------
// settle.ts — the rules for deciding whether a bet won or lost
// -----------------------------------------------------------------------------
// This is the "brain" of the betting. Given a finished game and one of the
// bets placed on it, we work out the result. It is written as a PURE function
// (it takes data in, returns a result, touches nothing else) which makes it
// easy to read and easy to test.
//
// Bet types:
//   MONEYLINE (win/loss) : pick the team that will WIN the game.
//   OVER_UNDER           : pick whether total runs will be OVER or UNDER the line.
//   SPREAD               : pick against a run margin. We always apply the
//                          spread to the HOME team (it's the "favorite" at -1.5),
//                          so "home" wins if home wins by 2+, "away" wins if the
//                          game is within 1 run or away wins outright.
// -----------------------------------------------------------------------------

import type { Bet, Game } from "@prisma/client";

// A bet can end in three ways.
export type BetOutcome = "WON" | "LOST" | "PUSH";

// "PUSH" means a tie/refund — e.g. total runs exactly equal the over/under line.
// In that case we give the user their stake back and no one wins.

export function evaluateBet(bet: Bet, game: Game): BetOutcome {
  // Safety: we should never evaluate a bet on a game that isn't over.
  if (game.status !== "FINAL") {
    throw new Error(`Cannot settle bet ${bet.id}: game ${game.id} is not final`);
  }

  switch (bet.type) {
    case "MONEYLINE": {
      // "winner" on the game is "away" or "home". Did the user pick that team?
      return game.winner === bet.pick ? "WON" : "LOST";
    }

    case "OVER_UNDER": {
      const total = (game.awayScore ?? 0) + (game.homeScore ?? 0);
      if (total === game.totalLine) return "PUSH"; // exact tie -> refund
      // If the user picked "over", they win when total > line, and vice versa.
      const overWon = total > game.totalLine;
      return bet.pick === "over" ? (overWon ? "WON" : "LOST") : overWon ? "LOST" : "WON";
    }

    case "SPREAD": {
      // margin is "home runs minus away runs". Positive = home winning.
      const margin = (game.homeScore ?? 0) - (game.awayScore ?? 0);
      if (bet.pick === "home") {
        // Home is favored by -1.5, so they must win by 2 or more.
        return margin >= 2 ? "WON" : "LOST";
      }
      // "away" gets +1.5, so they win if they win outright OR lose by only 1.
      return margin <= 1 ? "WON" : "LOST";
    }

    default:
      // Should never happen (we validate bet types when placing a bet).
      throw new Error(`Unknown bet type: ${bet.type}`);
  }
}
