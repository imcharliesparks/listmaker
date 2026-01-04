import { auth } from "@clerk/nextjs/server";
import type { Context as ApiContext } from "@repo/api";
import { prisma } from "@repo/database";

export async function createTRPCContext(): Promise<ApiContext> {
  const session = await auth();

  // Auto-create user if authenticated but not in DB
  let user = null;
  if (session.userId) {
    const clerkUser = session;
    user = await prisma.user.upsert({
      where: { clerkId: session.userId },
      update: {},
      create: {
        clerkId: session.userId,
        email: clerkUser.sessionClaims?.email as string ?? `user-${session.userId}@example.com`,
        username: clerkUser.sessionClaims?.username as string | null,
        balance: 10000, // Starting chips
      },
    });
  }

  return {
    session,
    user,
    prisma,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
