import type { PrismaClient, User } from "@prisma/client";

export type Session = {
  userId?: string | null;
  sessionClaims?: unknown;
} | null;

export type Context = {
  session: Session;
  user: User | null;
  prisma: PrismaClient;
};
