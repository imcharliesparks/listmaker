import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../server";

export const betsRouter = router({
  place: protectedProcedure
    .input(
      z.object({
        matchId: z.string(),
        amount: z.number().min(1),
        outcome: z.enum(["HOME", "AWAY", "DRAW"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.balance < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient balance",
        });
      }

      const match = await ctx.prisma.match.findUnique({
        where: { id: input.matchId },
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found",
        });
      }

      if (match.status !== "UPCOMING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Match is not available for betting",
        });
      }

      const odds =
        input.outcome === "HOME"
          ? match.homeOdds
          : input.outcome === "AWAY"
            ? match.awayOdds
            : match.drawOdds ?? 0;

      if (odds === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid bet outcome",
        });
      }

      const bet = await ctx.prisma.$transaction(async (tx) => {
        const newBet = await tx.bet.create({
          data: {
            userId: ctx.user.id,
            matchId: input.matchId,
            amount: input.amount,
            odds,
            outcome: input.outcome,
            status: "PENDING",
          },
        });

        await tx.user.update({
          where: { id: ctx.user.id },
          data: { balance: { decrement: input.amount } },
        });

        await tx.transaction.create({
          data: {
            userId: ctx.user.id,
            type: "BET_PLACED",
            amount: -input.amount,
            balance: ctx.user.balance - input.amount,
            reference: newBet.id,
          },
        });

        return newBet;
      });

      return bet;
    }),

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        status: z.enum(["PENDING", "WON", "LOST", "CANCELLED", "REFUNDED"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const bets = await ctx.prisma.bet.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          match: true,
        },
        take: input.limit,
        orderBy: { createdAt: "desc" },
      });

      return bets;
    }),

  getById: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .query(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findFirst({
        where: {
          id: input.betId,
          userId: ctx.user.id,
        },
        include: {
          match: true,
        },
      });

      if (!bet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bet not found",
        });
      }

      return bet;
    }),

  cancel: protectedProcedure
    .input(z.object({ betId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bet = await ctx.prisma.bet.findFirst({
        where: {
          id: input.betId,
          userId: ctx.user.id,
        },
        include: {
          match: true,
        },
      });

      if (!bet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bet not found",
        });
      }

      if (bet.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only cancel pending bets",
        });
      }

      if (bet.match.status !== "UPCOMING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel bet for started match",
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.bet.update({
          where: { id: input.betId },
          data: { status: "CANCELLED" },
        });

        await tx.user.update({
          where: { id: ctx.user.id },
          data: { balance: { increment: bet.amount } },
        });

        await tx.transaction.create({
          data: {
            userId: ctx.user.id,
            type: "BET_REFUND",
            amount: bet.amount,
            balance: ctx.user.balance + bet.amount,
            reference: bet.id,
          },
        });
      });

      return { success: true };
    }),
});
