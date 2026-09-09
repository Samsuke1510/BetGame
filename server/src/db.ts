// -----------------------------------------------------------------------------
// db.ts — a single shared connection to the database
// -----------------------------------------------------------------------------
// Prisma creates the client from our schema (server/prisma/schema.prisma).
// We create ONE instance and reuse it everywhere so we don't open dozens of
// database connections. Import { prisma } from "./db" in any file that needs
// to read or write data.

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
