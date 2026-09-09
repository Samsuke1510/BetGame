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
3. **Watch your balance** — winnings are added when the game finishes.
4. **Daily €30** — every user gets a €30 top-up each day, and it *accumulates*
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

```bash
# 1. Install all dependencies (both apps at once — npm workspaces)
npm install

# 2. Create the database (SQLite file) — only the first time
npm run prisma:migrate -w server

# 3. Start backend + frontend together
npm run dev
```

Then open **http://localhost:5173** in your browser.

- The **web app** runs on port **5173**.
- The **backend** runs on port **4000** (the web app forwards `/api` calls there automatically).

> If you ever need them separately: `npm run dev:server` and `npm run dev:web`.

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

- Over/Under line = **9.0** runs
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
| POST   | `/api/bets`          | yes  | Place a bet (deducts stake) |
| GET    | `/api/bets`          | yes  | Your bets, past and pending |
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

Where's this logic? `server/src/lib/settle.ts` (the rules) and
`server/src/cron/jobs.ts` (applying them to the database).

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