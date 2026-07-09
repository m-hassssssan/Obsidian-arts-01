import { Hono } from "hono";
import { cors } from "hono/cors";
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



app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      return origin;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type", "x-trpc-source"],
  })
);

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
    await db.insert(users).values({
      unionId,
      role,
      lastSignInAt: new Date(),
    });
    const [created] = await db
      .select()
      .from(users)
      .where(eq(users.unionId, unionId));
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
  const resHeaders = new Headers();
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: async (opts) => {
      const ctx = await createContext(opts);
      ctx.resHeaders = resHeaders;
      return ctx;
    },
    onError({ error, path }) {
      console.error(`[trpc] ${path} failed:`, error);
    },
  });

  const newResponse = new Response(response.body, response);
  resHeaders.forEach((value, key) => {
    newResponse.headers.append(key, value);
  });
  return newResponse;
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction && !process.env.VERCEL) {
  import("@hono/node-server").then(({ serve }) => {
    import("./lib/vite").then(({ serveStaticFiles }) => {
      serveStaticFiles(app);
      const port = parseInt(process.env.PORT || "3000");
      serve({ fetch: app.fetch, port }, () => {
        console.log(`Server running on http://localhost:${port}/`);
      });
    });
  });
}
