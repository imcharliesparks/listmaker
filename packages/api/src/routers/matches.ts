import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../server";

export const matchesRouter = router({
  getAvailable: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const matches = await ctx.prisma.match.findMany({
        where: {
          status: { in: ["UPCOMING", "LIVE"] },
        },
        take: input.limit,
        orderBy: { startTime: "asc" },
      });

      return matches;
    }),

  getById: publicProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.prisma.match.findUnique({
        where: { id: input.matchId },
        include: {
          bets: {
            select: {
              id: true,
              amount: true,
              outcome: true,
              status: true,
            },
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found",
        });
      }

      return match;
    }),

  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["UPCOMING", "LIVE", "FINISHED", "CANCELLED"]).optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const matches = await ctx.prisma.match.findMany({
        where: input.status ? { status: input.status } : undefined,
        take: input.limit,
        orderBy: { startTime: "desc" },
      });

      return matches;
    }),

  getOdds: publicProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.prisma.match.findUnique({
        where: { id: input.matchId },
        select: {
          id: true,
          homeOdds: true,
          awayOdds: true,
          drawOdds: true,
          status: true,
        },
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found",
        });
      }

      return match;
    }),
});
