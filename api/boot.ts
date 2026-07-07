import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { Paths } from "@contracts/constants";
import { signSessionToken, sessionCookieName } from "./lib/jwt";
import { getSessionCookieOptions } from "./lib/cookies";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Health check
app.get("/api/health", (c) =>
  c.json({ ok: true, ts: Date.now(), env: env.isProduction ? "prod" : "dev" }),
);

// OAuth callback stub. The original project references Kimi OAuth (KIMI_AUTH_URL
// and KIMI_OPEN_URL). We keep the surface compatible: a browser hits
// /api/oauth/callback?code=...&unionId=..., we upsert the user, mint a JWT,
// set the session cookie, and redirect to the app home.
app.get(Paths.oauthCallback, async (c) => {
  const code = c.req.query("code");
  const unionId = c.req.query("unionId");
  if (!code || !unionId) {
    return c.json({ error: "Missing code or unionId" }, 400);
  }

  // In a real deployment you'd exchange `code` with KIMI_OPEN_URL. For local
  // development we trust the unionId from the query string and upsert.
  const db = getDb();
  let role: "user" | "admin" = "user";
  if (env.ownerUnionId && unionId === env.ownerUnionId) {
    role = "admin";
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.unionId, unionId))
    .limit(1);

  let user = existing;
  if (!user) {
    const [insertResult] = await db.insert(users).values({
      unionId,
      role,
      lastSignInAt: new Date(),
    });
    const [created] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(insertResult.insertId)));
    user = created;
  } else {
    await db
      .update(users)
      .set({ lastSignInAt: new Date(), role })
      .where(eq(users.id, user.id));
    const [updated] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    user = updated;
  }

  if (!user) {
    return c.json({ error: "Failed to create user" }, 500);
  }

  const token = await signSessionToken({
    uid: user.id,
    unionId: user.unionId,
    role: user.role,
  });

  const cookieOpts = getSessionCookieOptions(
    c.req.raw.headers,
    env.sessionTtlSeconds,
  );
  const parts = [
    `${sessionCookieName}=${token}`,
    `Path=${cookieOpts.path}`,
    `Max-Age=${cookieOpts.maxAge ?? 0}`,
    `HttpOnly`,
    `SameSite=${cookieOpts.sameSite}`,
  ];
  if (cookieOpts.secure) parts.push("Secure");
  c.header("Set-Cookie", parts.join("; "));

  return c.redirect("/");
});

app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[trpc] ${path} failed:`, error);
    },
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
