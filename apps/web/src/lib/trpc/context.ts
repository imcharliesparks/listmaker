import { auth } from "@clerk/nextjs/server";
import type { Context as ApiContext } from "@repo/api";
import { prisma } from "@repo/database";

export async function createTRPCContext(): Promise<ApiContext> {
  const session = await auth();

  let user = null;
  if (session.userId) {
    const clerkUser = session;
    const email =
      (clerkUser.sessionClaims?.email as string | undefined) ??
      `user-${session.userId}@example.com`;
    const displayName = (clerkUser.sessionClaims?.username as string | undefined) ?? null;

    user = await prisma.user.upsert({
      where: { id: session.userId },
      update: {
        email,
        displayName,
      },
      create: {
        id: session.userId,
        email,
        displayName,
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
