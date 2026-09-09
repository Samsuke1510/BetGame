// -----------------------------------------------------------------------------
// routes/auth.ts — registration and login endpoints
// -----------------------------------------------------------------------------
// Routes are the "URLs" of our API. The web app calls these with fetch/axios.
//
//   POST /api/auth/register  -> create a new account, returns a token
//   POST /api/auth/login     -> log in, returns a token
//   GET  /api/auth/me        -> info about the currently logged-in user
// -----------------------------------------------------------------------------

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { hashPassword, signToken, verifyPassword } from "../lib/auth";
import { requireAuth } from "../middleware/auth";

// "zod" lets us validate what the client sends us. If the body is missing a
// field or the wrong type, we reject it before touching the database.
const credentialsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(4, "Password must be at least 4 characters").max(100),
});

export const authRouter = Router();

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  // 1. Validate the input.
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { username, password } = parsed.data;

  // 2. Make sure the username isn't already taken.
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  // 3. Create the user. balance defaults to 30 (see schema). Password is hashed.
  const user = await prisma.user.create({
    data: { username, passwordHash: hashPassword(password) },
  });

  // 4. Hand back a login token so they're logged in immediately.
  res.status(201).json({ token: signToken(user.id), user: { id: user.id, username: user.username, balance: user.balance } });
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  // Check the password only if the user exists. (Don't reveal which one failed.)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  res.json({ token: signToken(user.id), user: { id: user.id, username: user.username, balance: user.balance } });
});

// GET /api/auth/me
// Protected by requireAuth — returns the logged-in user (with current balance).
authRouter.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});
