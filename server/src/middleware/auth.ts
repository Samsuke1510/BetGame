// -----------------------------------------------------------------------------
// middleware/auth.ts — make sure the user is logged in
// -----------------------------------------------------------------------------
// Express "middleware" is a function that runs BEFORE a route handler. This one
// checks the request's Authorization header for a valid JWT. If valid, it loads
// the matching user from the DB and attaches it to the request so route
// handlers can use `req.user`. If invalid, it sends back 401 (Unauthorized).

import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/auth";
import { prisma } from "../db";

// We extend Express's Request type so `req.user` is typed for our route handlers.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        balance: number;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // The token is sent as:  Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  const token = header.slice("Bearer ".length);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Load the fresh user from the DB (their balance may have changed).
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    res.status(401).json({ error: "User no longer exists" });
    return;
  }

  // Attach the user to the request for the route handler to use.
  req.user = { id: user.id, username: user.username, balance: user.balance };
  next();
}
