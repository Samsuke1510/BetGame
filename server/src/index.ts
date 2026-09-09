// -----------------------------------------------------------------------------
// index.ts — where the whole server comes together
// -----------------------------------------------------------------------------
// This file:
//   1. Loads settings from .env
//   2. Creates the Express app
//   3. Mounts all routes under /api
//   4. Starts the background cron jobs
//   5. Listens on a port so clients can connect
// -----------------------------------------------------------------------------

import "dotenv/config"; // load .env values into process.env
import express from "express";
import cors from "cors";
import { PORT } from "./config";
import { authRouter } from "./routes/auth";
import { gamesRouter } from "./routes/games";
import { betsRouter } from "./routes/bets";
import { parlaysRouter } from "./routes/parlays";
import { startJobs } from "./cron/jobs";

const app = express();

// cors: allow the web app (running on another port during dev) to call us.
app.use(cors());

// express.json(): parse JSON request bodies so req.body works in routes.
app.use(express.json());

// A tiny health route so you can check the server is alive in the browser.
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Mount our route groups under the /api prefix.
app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);
app.use("/api/bets", betsRouter);
app.use("/api/parlays", parlaysRouter);

// Start the server and the background jobs together.
app.listen(PORT, () => {
  console.log(`BetGame server running at http://localhost:${PORT}`);
  startJobs();
});