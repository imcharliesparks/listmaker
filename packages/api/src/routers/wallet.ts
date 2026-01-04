import { z } from "zod";
import { router, protectedProcedure } from "../server";

export const walletRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    return {
      balance: ctx.user.balance,
      userId: ctx.user.id,
    };
  }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.prisma.transaction.findMany({
        where: { userId: ctx.user.id },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined = undefined;
      if (transactions.length > input.limit) {
        const nextItem = transactions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        transactions,
        nextCursor,
      };
    }),
});
