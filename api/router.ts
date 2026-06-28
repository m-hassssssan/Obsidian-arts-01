import { commissionRouter } from "./routers/commission";
import { messageRouter } from "./routers/message";
import { adminRouter } from "./routers/admin";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  commission: commissionRouter,
  message: messageRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
