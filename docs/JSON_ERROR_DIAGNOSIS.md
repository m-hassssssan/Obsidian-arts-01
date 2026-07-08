# Login & Signup `Unexpected token '<', "<html> <he"... is not valid JSON`

## TL;DR

Your **code is correct**. The error is a deployment symptom, not a bug.

GitHub Pages only serves static files. It does not run the Hono/tRPC backend.
When the browser calls `POST /api/trpc/auth.login`, GitHub Pages has no such
route, so it returns `dist/public/index.html` as a fallback. The HTML body
starts with `<html>`, and `response.json()` throws exactly the error you see.

The same error will occur for any tRPC call from the deployed site until a
real backend is reachable at `/api/trpc/*` (or at the URL the client is pointed
to via `VITE_API_BASE_URL`).

## The exact chain

1. User clicks **SIGN IN** in `src/pages/Login.tsx:33`.
2. `trpc.auth.login.useMutation` is invoked.
3. The tRPC client (`src/providers/trpc.tsx:14`) calls
   `fetch("/api/trpc/auth.login", { method: "POST", body: {…} })`.
4. On a running server, this hits the Hono handler in `api/boot.ts:100`
   and returns a JSON response.
5. **On GitHub Pages**, there is no server. The static host returns
   `index.html` (the SPA shell) for any path that doesn't match a file in
   `dist/public`. The response body is HTML — the parser fails on the
   first `<` character.
6. The browser surfaces the JSON parse error.

`src/providers/trpc.tsx` (line 14) hardcodes `url: "/api/trpc"`. There is
no environment variable to point it at a remote backend, so even if you
deployed the backend somewhere, the deployed frontend would still hit
the Pages origin and get the same HTML.

## The two fixes (you need both)

### Fix 1 — deploy the backend somewhere it can run

GitHub Pages cannot run Node. Pick a host that can.

The repo includes a `Dockerfile`. Recommended options, in order of effort:

- **Render** — connect the repo, choose "Web Service", `Dockerfile` is
  detected automatically, set env vars, attach a managed MySQL.
- **Fly.io** — `fly launch`, attach a MySQL add-on or use a PlanetScale
  connection string.
- **Railway** — similar to Render.
- **A $5 VPS** — clone, set env, `docker compose up`.

The backend must be reachable at a stable URL (e.g.
`https://api.obsidianarts.example`).

### Fix 2 — point the deployed frontend at the backend

This is what this PR changes:

- `src/providers/trpc.tsx` now reads `import.meta.env.VITE_API_BASE_URL`.
  If unset, it falls back to `"/api/trpc"` (works for local dev with
  Vite's dev proxy).
- `vite.config.ts` adds a dev proxy from `/api` to the Hono server so
  local dev still works with no env var.
- `.env.example` documents the new variable.

For the deployed site, you set `VITE_API_BASE_URL` to the full URL of
your backend (e.g. `https://api.obsidianarts.example/api/trpc`) **at
build time**, then redeploy to GitHub Pages. Because this is a build-time
variable baked into the bundle, you must rebuild the frontend after
changing it.

## Cookies across origins (the subtle part)

Your session cookie is set in `api/lib/cookies.ts:8`. When the frontend
(`m-hassssssan.github.io`) and the backend (`api.obsidianarts.example`)
are on different origins, the browser needs `SameSite=None; Secure` on
the cookie. The current code already does this when the backend host
is **not** localhost (line 16: `sameSite: localhost ? "Lax" : "None"`),
and adds `Secure` when not localhost (line 17).

This means:

- **The backend MUST be served over HTTPS.** A `http://` backend will
  not accept the cookie from a `https://` frontend.
- **The backend MUST be reachable from the browser** (not blocked by a
  firewall or CORS). Hono does not set CORS headers by default — see
  `docs/DEPLOYMENT.md` for the exact middleware to add.
- **The `credentials: "include"` flag** is already set in
  `src/providers/trpc.tsx:20`. Keep it.

If you set up a reverse proxy that puts the API under the **same
origin** as the frontend (e.g. `https://obsidianarts.example/api/...`),
the cookie situation becomes trivial and CORS goes away. This is the
easiest deployment shape but requires moving off GitHub Pages.

## What this PR does NOT do

- It does not deploy the backend. You must do that.
- It does not change cookie behavior. It works as designed for
  same-origin setups, and works for cross-origin setups as long as the
  backend is HTTPS and serves CORS headers.
- It does not add the threaded admin inbox UI. That's a separate
  change tracked elsewhere in the project.

## How to verify the diagnosis locally

If the diagnosis is wrong, the next most likely culprits in order are:

1. **CORS preflight failing** — open the browser DevTools → Network,
   click the failing request, look at the response headers. If you see
   `Access-Control-Allow-Origin` missing on an OPTIONS request, CORS is
   the problem (see `docs/DEPLOYMENT.md`).
2. **Cookie not being sent** — DevTools → Application → Cookies. After
   a successful login, you should see `obsidian_sid` set against your
   backend's origin. If it's not there, the backend is not on HTTPS or
   the `Secure` flag is missing.
3. **Wrong base URL baked into the bundle** — view source on the
   deployed `index.html`, search for `/api/trpc`. If you see
   `https://m-hassssssan.github.io/OBSIDIAN.ARTS/api/trpc`, you forgot
   to set `VITE_API_BASE_URL` before building.

## Related

- `docs/DEPLOYMENT.md` — concrete steps to get the backend live and the
  frontend talking to it.
