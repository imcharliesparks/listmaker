import { router } from "./server";
import { walletRouter } from "./routers/wallet";
import { betsRouter } from "./routers/bets";
import { matchesRouter } from "./routers/matches";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  wallet: walletRouter,
  bets: betsRouter,
  matches: matchesRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
