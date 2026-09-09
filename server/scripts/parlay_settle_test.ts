import { evaluateParlay } from "../src/lib/settle";

const legs = (statuses: ("WON" | "LOST" | "PUSH" | "PENDING")[]) =>
  statuses.map((s) => ({ status: s, odds: s === "PUSH" ? 1 : 1.91 }));

let r = evaluateParlay(legs(["WON", "WON", "WON"]), 5);
console.log("ALL WON →", JSON.stringify(r), "expected WON payout", (5 * 1.91 ** 3).toFixed(2));

r = evaluateParlay(legs(["WON", "LOST", "WON"]), 5);
console.log("ONE LOST →", JSON.stringify(r), "expected LOST");

r = evaluateParlay(legs(["WON", "PENDING", "WON"]), 5);
console.log("ONE PENDING →", JSON.stringify(r), "expected PENDING");

r = evaluateParlay(legs(["PUSH", "PUSH"]), 5);
console.log("ALL PUSH →", JSON.stringify(r), "expected PUSH payout 5");

r = evaluateParlay(legs(["WON", "PUSH"]), 5);
console.log("WON+PUSH →", JSON.stringify(r), "expected WON payout", (5 * 1.91).toFixed(2));