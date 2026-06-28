import { authRouter } from "./auth-router";
import { commissionRouter } from "./routers/commission";
import { messageRouter } from "./routers/message";
import { adminRouter } from "./routers/admin";
import { createRouter, publicQuery } from "./middleware";
import { authenticateRequest } from "./kimi/auth";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  session: publicQuery.query(async ({ ctx }) => {
    try {
      const user = await authenticateRequest(ctx.req.headers);
      return user;
    } catch {
      return null;
    }
  }),
  auth: authRouter,
  commission: commissionRouter,
  message: messageRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
