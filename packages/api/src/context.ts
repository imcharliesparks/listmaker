import type { PrismaClient, User } from "@prisma/client";

export type Session = {
  userId?: string | null;
} | null;

export type Context = {
  session: Session;
  user: User | null;
  prisma: PrismaClient;
};
