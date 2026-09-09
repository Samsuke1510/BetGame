# ⚾ BetGame — Virtual MLB Betting App

A **virtual-money** sports betting app for MLB baseball. No real money — every user
gets **€30 a day** of play money and can bet it on the day's MLB games.

- 💻 **Web app** (this repo): React + TypeScript
- ⚙️ **Backend**: Node.js + TypeScript + Express + Prisma (SQLite)
- 🗓 **Data**: free [MLB Stats API](https://statsapi.mlb.com) — fetched daily, no key needed

> A **React Native (mobile) version** is planned for a later step. It will reuse this
> same backend, so the API here is already mobile-friendly (plain JSON).

---

## What you can do in the app

1. **Create an account** (username + password). You start with **€30** virtual balance.
2. **Bet on today's MLB games** in three ways:
   - **Win / Loss** — pick which team wins.
   - **Over / Under** — pick whether total runs will go over or under the line (9.0).
   - **Point Spread** — pick against the home team's -1.5 spread.
3. **Build parlays** — combine 2+ picks from *different* games into one ticket.
   Each leg's odds multiply together (e.g. 3 picks of 1.91 → ~6.97), so the potential
   win grows fast.
4. **Every game card shows its start time in Paris time**, colored with each team's colors.
5. **Watch your balance** — winnings are added when the game finishes.
6. **Daily €30** — every user gets a €30 top-up each day, and it *accumulates*
   (unused balance carries over; it is never reset).

> **Small note:** a brand-new account gets its starting €30 immediately so you can bet
> right away, *and* the daily top-up may also fire on the same calendar day — so day one
> can look like €60. This is intentional and harmless for a virtual-money game.

---

## The stack (and why)

| Piece | Technology | Why |
|-------|-----------|-----|
| Backend | **Express (Node.js)** | Simple, popular, beginner-friendly HTTP server |
| Language | **TypeScript** | Catches bugs before you run the app |
| Database | **Prisma + SQLite** | Prisma makes DB work feel like plain functions; SQLite needs zero setup |
| Auth | **JWT + bcryptjs** | Standard login tokens; passwords are always hashed |
| Scheduling | **node-cron** | Runs the daily "fetch / credit / settle" jobs automatically |
| Frontend | **React + Vite** | The most common React setup, fast to run |
| API calls | **Axios** | Nice, readable HTTP requests from the browser |

---

## How to run it

You need [Node.js](https://nodejs.org) 18+ (this project was built with Node 24).
All commands run from the `BetGame` folder (the one that contains `package.json`).

### Everyday run (the only command you need)

```bash
npm run dev
```

Then open **http://localhost:5173** in your browser. To stop the app, press `Ctrl + C`
in the terminal. That one command starts **both** the backend and the web app:

- The **backend** runs on port **4000** (it fetches MLB games, credits €30 daily, settles bets).
- The **web app** runs on port **5173** and forwards `/api` calls to the backend automatically.

### First-time setup (new machine / empty folder)

Only do these once, before the first `npm run dev`:

```bash
# 1. Download all dependencies (both apps at once — npm workspaces)
npm install

# 2. Create the SQLite database file (this works because of the workspace flag):
npm run prisma:migrate -w server

# 3. Then start the app as usual
npm run dev
```

> Running them separately, if you ever want just one side: `npm run dev:server`
> and `npm run dev:web`.

### Troubleshooting / if it doesn't start

- **The browser shows nothing / can't connect** → the terminal output shows a
  `Local:` URL from Vite (normally exactly `http://localhost:5173`); use that.
- **Port already in use** → change `PORT` in `server/.env` and the proxy target in
  `web/vite.config.ts` to match.
- **App won't open / no games / want a fresh start** → delete the
  `server/prisma/dev.db` file, then run step 2 (`prisma:migrate`) again. That wipes
  all users and bets (dev-only).
- **`npm` is not recognized on Windows** → Node.js installs `npm` for you; re-run the
  Node installer (or reopen the terminal) so the command is on your PATH.

---

## How it works (the big picture)

```
   every minute (while dev is running)
   ┌────────────────────────────────────────────┐
   │  cron/jobs.ts                              │
   │  1. FETCH  — pull today's MLB games from   │
   │              statsapi.mlb.com → save them  │
   │  2. CREDIT — add €30 to every user's       │
   │              balance (only once per day)   │
   │  3. SETTLE — when a game is FINAL, decide  │
   │              pending bets, pay the winners  │
   └────────────────────────────────────────────┘
                     ▲
   web app ── /api ──┘   (Express routes: auth, games, bets)
```

### The "every minute" schedule
Running jobs every minute is *not* what a production app would do — it's a convenience
for development so you can watch the daily credit appear and settle bets quickly without
waiting 24h. In production you'd run FETCH/CREDIT once a day and SETTLE every few minutes.
Look at the comments in `server/src/cron/jobs.ts` for exact schedule alternatives.

### Betting lines (where do the 9.0 / -1.5 numbers come from?)
The free MLB API gives schedules and **scores**, but **no betting odds**. So this app
`generates simple default lines` (configurable in `server/src/config.ts`):

- Over/Under line = **7.5** runs
- Home-team spread = **-1.5** (home must win by 2+ to cover)
- Odds = flat **1.91** on every bet (~ -110 in American odds)

A future version can replace these with real lines from **The Odds API**.

---

## Project map

```
BetGame/
├── package.json            # workspace root — runs both apps with one command
├── server/                 # the backend (API + database + cron jobs)
│   ├── prisma/schema.prisma# the database model: User, Game, Bet, AppState
│   └── src/
│       ├── index.ts        # wires up Express + routes + cron
│       ├── config.ts       # all settings: daily €30, odds, ports, line defaults
│       ├── db.ts           # the single Prisma database connection
│       ├── routes/         # the API endpoints (auth, games, bets)
│       ├── middleware/     # requireAuth — checks logged-in users
│       ├── lib/            # helpers: mlb fetch, password hashing, settle rules
│       └── cron/jobs.ts    # the daily fetch / credit / settle routine
└── web/                    # the React frontend
    └── src/
        ├── App.tsx         # top-level: routing + "are we logged in?"
        ├── api.ts          # all requests to the backend, token added automatically
        ├── types.ts        # TypeScript shapes for Game / Bet / User
        ├── pages/          # Login, Register, Dashboard
        └── components/     # Navbar, GameCard, BetModal
```

Every file has friendly comments explaining what it does and why, written for a beginner.

---

## API endpoints

| Method | URL                  | Auth | What it does |
|--------|----------------------|------|--------------|
| POST   | `/api/auth/register` | no   | Create account, get a token |
| POST   | `/api/auth/login`    | no   | Log in, get a token |
| GET    | `/api/auth/me`       | yes  | Current user + balance |
| GET    | `/api/games`         | yes  | Today's MLB games (from DB) |
| POST   | `/api/bets`          | yes  | Place a single bet (deducts stake) |
| GET    | `/api/bets`          | yes  | Your single bets, past and pending |
| POST   | `/api/parlays`       | yes  | Place a parlay (2–10 picks, deducts stake) |
| GET    | `/api/parlays`       | yes  | Your parlay tickets |
| GET    | `/api/health`        | no   | "Is the server alive?" |

---

## The money rules (read this — it's the core logic)

- **Starting balance:** €30 (given at sign-up).
- **Daily credit:** +€30 every calendar day to *every* user, once per day.
- **Accumulate:** nothing resets. Unused balance and winnings simply pile up.
- **Placing a bet:** your stake is removed from your balance immediately.
- **Winning:** you receive back `stake × odds` (for example €10 at 1.91 → €19.10).
  Since your stake was already removed, that €19.10 is the full return.
- **Losing:** the stake stays with the house (it's just virtual).
- **Push (tie):** if total runs *exactly* equal the over/under line, you get your
  stake refunded and the bet is marked "Refunded".
- **Parlay payout:** your single stake × the combined odds (all legs' odds multiplied).
  A parlay only pays if **every** leg wins; one losing leg loses the whole ticket.
  Pushed legs don't kill a parlay — they're just taken out of the odds (counted as 1.0)
  so your payout is slightly lower.

Where's this logic? `server/src/lib/settle.ts` (the rules) and
`server/src/cron/jobs.ts` (applying them to the database).

### Game times ⏰
MLB publishes game start times in UTC. The app stores them and every card converts them
to **Paris time** (`Europe/Paris`) in the browser (see `web/src/utils/date.ts`) — including
summer/winter time automatically.

### Card colors 🎨
Each MLB team is mapped to its brand color (`web/src/data/teamColors.ts`) — e.g. Yankees
navy, Red Sox red. Every game card shows a stripe blending the two teams' colors plus a
colored chip on each team name. Teams not in the list get a stable fallback color, so no
card ever looks broken.

---

## FAQ / Troubleshooting

**"No MLB games available today."**
The MLB season runs roughly April → October. In the off-season the schedule is empty
and that's normal — the app still runs, there's just nothing to bet on. You can also hit
games on future dates by sending `?date=YYYY-MM-DD` to `GET /api/games`.

**Port already in use?** Change `PORT` in `server/.env` and the proxy target in `web/vite.config.ts`.

**Forgot my balance / want a fresh start?** Delete the `server/prisma/dev.db` file and run
`npm run prisma:migrate -w server` again. That wipes all users and bets (dev-only, of course).

---

## Next steps (planned)

- 📱 **Mobile app** with React Native / Expo, reusing this exact API.
- 📊 Real betting lines via The Odds API.
- 🏆 More bet types (e.g. first-to-5-runs, full-game handicaps).
- 🔒 Hardening: rate limiting, stronger password rules.