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

// -----------------------------------------------------------------------------
// PARLAY RULES
// -----------------------------------------------------------------------------
// A parlay is a bundle of legs, each with its own outcome. The ticket follows
// the classic parlay rules:
//
//   • Any leg LOST      -> the whole ticket is LOST (no payout).
//   • Any leg PENDING   -> the ticket waits until every leg has finished.
//   • All legs PUSH     -> the ticket is a PUSH (stake refunded, no profit).
//   • Otherwise (some WON, the rest PUSH) -> the ticket WINS. The pushed legs
//     count as odds 1.0 (excluded), so the payout is:
//        stake × (odds of all WON legs multiplied together)
// -----------------------------------------------------------------------------

export interface ParlayLegOutcome {
  status: string; // "PENDING" | "WON" | "LOST" | "PUSH"
  odds: number;
}

export interface ParlayResult {
  status: "PENDING" | "WON" | "LOST" | "PUSH";
  payout: number | null; // how much the user gets back (null while pending / lost)
}

export function evaluateParlay(legs: ParlayLegOutcome[], stake: number): ParlayResult {
  // Rule 1: any lost leg kills the ticket.
  if (legs.some((leg) => leg.status === "LOST")) {
    return { status: "LOST", payout: null };
  }

  // Rule 2: if a match still hasn't finished, keep waiting.
  if (legs.some((leg) => leg.status === "PENDING")) {
    return { status: "PENDING", payout: null };
  }

  // Rule 3: every leg pushed (a full refund, no profit).
  if (legs.every((leg) => leg.status === "PUSH")) {
    return { status: "PUSH", payout: stake };
  }

  // Rule 4: we won! Multiply the odds of the legs that actually WON.
  // Pushed legs are left out (they "count as 1.0").
  const winOdds = legs
    .filter((leg) => leg.status === "WON")
    .reduce((product, leg) => product * leg.odds, 1);

  return { status: "WON", payout: stake * winOdds };
}
