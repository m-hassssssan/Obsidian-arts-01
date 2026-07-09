import { commissionRouter } from "./routers/commission";
import { messageRouter } from "./routers/message";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { githubRouter } from "./routers/github";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  commission: commissionRouter,
  message: messageRouter,
  admin: adminRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;
