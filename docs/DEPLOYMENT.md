# Deployment runbook

This document covers getting the OBSIDIAN.ARTS backend live and the
frontend talking to it, while keeping the public site on
`https://m-hassssssan.github.io/OBSIDIAN.ARTS`.

## Architecture

```
Browser
  │
  │  https://m-hassssssan.github.io/OBSIDIAN.ARTS/   (static frontend)
  │           │
  │           └─ fetch(/api/trpc/...)
  │              ↓ (with VITE_API_BASE_URL set, this becomes
  │                 https://api.<your-host>/api/trpc/...)
  ↓
Backend host  (Render / Fly / Railway / VPS)
  │
  │  Node + Hono on port 3000
  │  Dockerfile in repo root
  │
  ↓
MySQL / PlanetScale
```

## 1. Provision a MySQL database

You need a MySQL connection string in the form
`mysql://user:password@host:3306/dbname`. Options:

- **PlanetScale** — free tier, MySQL-compatible, set the connection
  string as `DATABASE_URL`.
- **Railway** — has a managed MySQL plugin.
- **Render** — managed PostgreSQL only; not compatible with this
  codebase. Use a managed MySQL add-on or external service.
- **Local MySQL on a VPS** — `apt install mysql-server`, create a DB
  and user, set `DATABASE_URL` accordingly.

## 2. Deploy the backend

### Option A: Render (recommended)

1. Sign in at <https://render.com>, click **New +** → **Web Service**.
2. Connect the `m-hassssssan/OBSIDIAN.ARTS` repo.
3. Render detects the `Dockerfile`. Confirm.
4. Set environment variables (see table below).
5. Click **Create Web Service**. The first build runs `npm run build`
   which builds the frontend and bundles the API server to
   `dist/boot.js`, then `npm start` runs it on port 3000.
6. Render gives you a URL like `https://obsidian-arts-api.onrender.com`.
   Use that in the next step.

### Option B: Fly.io

```sh
# one-time
fly auth signup
fly launch --no-deploy   # accepts Dockerfile, copies config

# per-deploy
fly secrets set APP_ID=obsidian \
              APP_SECRET=$(openssl rand -hex 32) \
              DATABASE_URL='mysql://…' \
              OWNER_UNION_ID=local-owner \
              FRONTEND_ORIGIN=https://m-hassssssan.github.io
fly deploy
```

### Option C: VPS

```sh
git clone https://github.com/m-hassssssan/OBSIDIAN.ARTS.git
cd OBSIDIAN.ARTS
cp .env.example .env
$EDITOR .env
docker build -t obsidian .
docker run -d --name obsidian -p 3000:3000 --env-file .env obsidian
```

Put nginx or Caddy in front for HTTPS — LetsEncrypt certs are
auto-issued by Caddy.

### Required environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `APP_ID` | yes | Any short string, used as JWT issuer. |
| `APP_SECRET` | yes | Long random string. JWT signing key + session secret. |
| `DATABASE_URL` | yes | `mysql://user:pass@host:3306/db`. |
| `OWNER_UNION_ID` | recommended | Local user(s) created with this `unionId` get `role: "admin"` (see `api/queries/users.ts:60`). |
| `FRONTEND_ORIGIN` | recommended | Full URL of the deployed frontend, used for CORS. |
| `PORT` | optional | Defaults to 3000. |
| `GITHUB_TOKEN` | optional | Enables GitHub write actions in the admin panel. |
| `GITHUB_OWNER` / `GITHUB_REPO` | optional | Defaults to `m-hassssssan` / `OBSIDIAN.ARTS`. |

### CORS — required because the frontend is on a different origin

The current `api/boot.ts` does **not** set CORS headers. Add this
before `app.use("/api/trpc/*", ...)`:

```ts
import { cors } from "hono/cors";

app.use(
  "/api/*",
  cors({
    origin: env.frontendOrigin,             // e.g. "https://m-hassssssan.github.io"
    credentials: true,                       // required for the session cookie
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["content-type", "x-trpc-source"],
  }),
);
```

Without this, the browser blocks the request preflight and the
frontend falls back to the same `<html>` parse error.

## 3. Run the database migrations and seed

From the deployed host, or locally pointed at the same DB:

```sh
npm install
npm run db:push     # creates tables
npm run db:seed     # inserts admin@obsidianarts.com / obsidian2026
                    # plus a few patron accounts and sample commissions
```

## 4. Rebuild the frontend with the backend URL

In your local checkout:

```sh
# .env.production (Vite reads this on `npm run build`)
echo 'VITE_API_BASE_URL=https://obsidian-arts-api.onrender.com/api/trpc' > .env.production

npm install
npm run build       # outputs to dist/public
npm run deploy      # pushes dist/public to gh-pages
```

The value must be the **full URL** of the tRPC endpoint, including
`/api/trpc`. Vite substitutes `import.meta.env.VITE_*` at build time —
rebuilding is required whenever the URL changes.

## 5. Smoke test

1. Visit `https://<your-backend>/api/health` — should return
   `{"ok":true,"ts":…}`.
2. Visit `https://m-hassssssan.github.io/OBSIDIAN.ARTS/login`.
3. Open DevTools → Network, log in with
   `admin@obsidianarts.com` / `obsidian2026`. The `auth.login` request
   should hit `<your-backend>/api/trpc/auth.login` and return 200 JSON.
4. Refresh — the session cookie persists across reloads.

## Cookie gotchas

`api/lib/cookies.ts` reads the `host` header from the request to decide
between `SameSite=Lax` (localhost) and `SameSite=None; Secure`
(everything else). For cross-origin to work:

- The backend must be HTTPS (browsers reject `SameSite=None` without
  `Secure`).
- The reverse proxy in front of the backend must pass the original
  `Host` header through. Render, Fly, and Caddy all do this by default.
- If the backend is behind a path prefix (e.g.
  `https://host.example/obsidian/api/trpc`), the cookie's `Path`
  attribute must match. The current code uses `Path=/`, which only
  works if the API is at the root of its host.

## Cheapest possible deploy

If you want the minimum viable setup:

1. **Render Web Service** with the Dockerfile.
2. **Render Key Value Store** is no good — you need MySQL. Use
   **PlanetScale** (free hobby tier).
3. **Vercel** instead of GitHub Pages: drag the `dist/public` folder
   in, set `VITE_API_BASE_URL` as a project env var, and the
   cookie/origin problem goes away because both halves are on
   `vercel.app` or your custom domain.

The Vercel path is the fewest moving parts. The GitHub-Pages-plus-
Render path is what this doc is written for.
