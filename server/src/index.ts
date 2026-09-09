// -----------------------------------------------------------------------------
// index.ts — where the whole server comes together
// -----------------------------------------------------------------------------
// This file:
//   1. Loads settings from .env
//   2. Creates the Express app
//   3. Mounts all routes under /api
//   4. Starts the background cron jobs
//   5. Listens on a port so clients can connect
//
// ── How to launch the whole app manually (no AI needed) ─────────────────────
// All commands run from the BetGame folder (the one containing package.json).
//
//   First time on a machine (create the database + install packages):
//     npm install
//     npm run prisma:migrate -w server
//
//   Every day after that, just:
//     npm run dev
//
//   Then open http://localhost:5173 in your browser (the web app). The backend
//   runs on http://localhost:4000. Press Ctrl+C to stop it all.
//   Need only one side? Use `npm run dev:server` (backend only) or
//   `npm run dev:web` (web app only).
// -----------------------------------------------------------------------------

import "dotenv/config"; // load .env values into process.env
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
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

// Serve the built web app (production). When web/dist exists, this Express
// server also hosts the React site, so one URL serves everything. In dev you
// leave this empty and use the Vite proxy on 5173 instead.
const webDist = path.join(__dirname, "../../web/dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  // Anything that is not an API call falls through to the React app.
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      res.sendFile(path.join(webDist, "index.html"));
    } else {
      next();
    }
  });
}

// Start the server and the background jobs together.
app.listen(PORT, () => {
  console.log(`BetGame server running at http://localhost:${PORT}`);
  startJobs();
});