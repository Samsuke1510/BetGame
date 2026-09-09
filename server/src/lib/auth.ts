// -----------------------------------------------------------------------------
// auth.ts — password hashing and login-token helpers
// -----------------------------------------------------------------------------
// "Hashing" means turning a password into a scrambled string that cannot be
// turned back. We NEVER store real passwords. bcryptjs also adds a random
// "salt", so two users with the same password get different hashes.
//
// A JWT (JSON Web Token) is the "login ticket" the server hands the browser
// after a successful login. The browser sends it back on every request, and
// the server verifies it with the secret to know who is making the request.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config";

// How many rounds of hashing to use. Higher = more secure but slower.
const SALT_ROUNDS = 10;

// Turn a plain-text password into a hashed version for storing in the DB.
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

// Compare a typed password against a stored hash. Returns true if they match.
export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

// The data we stuff inside a token. We only need the user id.
export interface TokenPayload {
  userId: number;
}

// Create a signed token for a user. This is what the browser keeps.
export function signToken(userId: number): string {
  const payload: TokenPayload = { userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify a token's signature and return its payload, or null if invalid/expired.
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    // Any error (bad signature, expired, malformed) means "not logged in".
    return null;
  }
}
