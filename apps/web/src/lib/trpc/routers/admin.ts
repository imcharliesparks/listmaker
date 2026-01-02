import { z } from "zod";
import { router, adminProcedure } from "../server";
import { TRPCError } from "@trpc/server";

export const adminRouter = router({
  importPlaceholder: adminProcedure
    .input(z.object({ data: z.string() }))
    .mutation(async () => {
      // Placeholder for importing data
      return { success: true, message: "Import placeholder - not implemented" };
    }),

  createMatch: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        homeTeam: z.string().min(1),
        awayTeam: z.string().min(1),
        startTime: z.date(),
        homeOdds: z.number().min(1),
        awayOdds: z.number().min(1),
        drawOdds: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.prisma.match.create({
        data: {
          name: input.name,
          description: input.description,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          startTime: input.startTime,
          homeOdds: input.homeOdds,
          awayOdds: input.awayOdds,
          drawOdds: input.drawOdds,
          status: "UPCOMING",
        },
      });

      return match;
    }),

  updateMatch: adminProcedure
    .input(
      z.object({
        matchId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        homeTeam: z.string().min(1).optional(),
        awayTeam: z.string().min(1).optional(),
        startTime: z.date().optional(),
        homeOdds: z.number().min(1).optional(),
        awayOdds: z.number().min(1).optional(),
        drawOdds: z.number().min(1).optional(),
        status: z.enum(["UPCOMING", "LIVE", "FINISHED", "CANCELLED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { matchId, ...data } = input;

      const match = await ctx.prisma.match.update({
        where: { id: matchId },
        data,
      });

      return match;
    }),

  deleteMatch: adminProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if match has any bets
      const betsCount = await ctx.prisma.bet.count({
        where: { matchId: input.matchId },
      });

      if (betsCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete match with existing bets. Cancel the match instead.",
        });
      }

      await ctx.prisma.match.delete({
        where: { id: input.matchId },
      });

      return { success: true };
    }),

  settleMatch: adminProcedure
    .input(
      z.object({
        matchId: z.string(),
        result: z.enum(["HOME", "AWAY", "DRAW"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.prisma.match.findUnique({
        where: { id: input.matchId },
        include: {
          bets: {
            where: { status: "PENDING" },
          },
        },
      });

      if (!match) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Match not found",
        });
      }

      if (match.status === "FINISHED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Match already settled",
        });
      }

      // Settle all bets in a transaction
      await ctx.prisma.$transaction(async (tx) => {
        // Update match status and result
        await tx.match.update({
          where: { id: input.matchId },
          data: {
            status: "FINISHED",
            result: input.result,
          },
        });

        // Process each bet
        for (const bet of match.bets) {
          const won = bet.outcome === input.result;
          const payout = won ? Math.floor(bet.amount * bet.odds) : 0;

          // Update bet status
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              status: won ? "WON" : "LOST",
              payout: won ? payout : 0,
            },
          });

          if (won) {
            // Update user balance
            const user = await tx.user.findUnique({
              where: { id: bet.userId },
            });

            if (user) {
              await tx.user.update({
                where: { id: bet.userId },
                data: { balance: { increment: payout } },
              });

              // Create transaction record
              await tx.transaction.create({
                data: {
                  userId: bet.userId,
                  type: "BET_WON",
                  amount: payout,
                  balance: user.balance + payout,
                  reference: bet.id,
                },
              });
            }
          }
        }
      });

      return { success: true, settledBets: match.bets.length };
    }),
});
