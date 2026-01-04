import { router } from "./server";
import { adminRouter } from "./routers/admin";
import { betsRouter } from "./routers/bets";
import { matchesRouter } from "./routers/matches";
import { walletRouter } from "./routers/wallet";

export const appRouter = router({
  wallet: walletRouter,
  bets: betsRouter,
  matches: matchesRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
