-- CreateTable
CREATE TABLE "Parlay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stake" REAL NOT NULL,
    "totalOdds" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payout" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Parlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "pick" TEXT NOT NULL,
    "stake" REAL NOT NULL,
    "odds" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payout" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "parlayId" INTEGER,
    CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Bet_parlayId_fkey" FOREIGN KEY ("parlayId") REFERENCES "Parlay" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Bet" ("createdAt", "gameId", "id", "odds", "payout", "pick", "stake", "status", "type", "userId") SELECT "createdAt", "gameId", "id", "odds", "payout", "pick", "stake", "status", "type", "userId" FROM "Bet";
DROP TABLE "Bet";
ALTER TABLE "new_Bet" RENAME TO "Bet";
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gamePk" INTEGER NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "gameDate" TEXT NOT NULL,
    "gameTime" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "awayScore" INTEGER,
    "homeScore" INTEGER,
    "totalLine" REAL NOT NULL DEFAULT 9.0,
    "spread" REAL NOT NULL DEFAULT -1.5,
    "winner" TEXT
);
INSERT INTO "new_Game" ("awayScore", "awayTeam", "gameDate", "gamePk", "homeScore", "homeTeam", "id", "spread", "status", "totalLine", "winner") SELECT "awayScore", "awayTeam", "gameDate", "gamePk", "homeScore", "homeTeam", "id", "spread", "status", "totalLine", "winner" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_gamePk_key" ON "Game"("gamePk");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
