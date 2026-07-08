# OBSIDIAN.ARTS — Backend & Admin Panel

A brutalist contemporary art gallery site (Berlin & New York) with a fully
functional admin panel, tRPC API, MySQL persistence, JWT auth, and GitHub
integration.

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind, shadcn/ui primitives
- **Backend** — Hono on Node, tRPC v11, Drizzle ORM (MySQL/PlanetScale),
  jose (JWT), Node scrypt (password hashing)
- **GitHub** — REST API integration (commits, files, issues, releases, repo
  contents) via fetch from the admin panel

## Quick start

```bash
# 1. Install
npm install

# 2. Provision database. Either:
#    a) Run the included SQL:  db/migrations/0000_initial.sql
#    b) Or:  npm run db:push  (drizzle-kit, requires DATABASE_URL)

# 3. Configure env
cp .env.example .env
# Edit .env:  DATABASE_URL, APP_ID, APP_SECRET, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

# 4. Seed
npm run db:seed    # or:  npx tsx db/seed.ts

# 5. Dev
npm run dev

# 6. Production
npm run build
npm start
```

## Seed credentials

After running `npm run db:seed`, check `db/seed.ts` to find the default user accounts and credentials.

## Routes

| Path                          | Who           | What                                       |
| ----------------------------- | ------------- | ------------------------------------------ |
| `/`                           | public        | Brutalist gallery landing                  |
| `/login`                      | public        | Sign in (email or member id)               |
| `/signup`                     | public        | Create account                             |
| `/admin`                      | admin         | Dashboard with stats & charts              |
| `/admin/commissions`          | admin         | List + filter + sort + search              |
| `/admin/commissions/:id`      | admin         | Full detail, timeline, conversation        |
| `/admin/users`                | admin         | Manage users (role/status/bio/delete)      |
| `/admin/messages`             | admin         | Global inbox + post studio announcement    |
| `/admin/github`               | admin         | Read & write the OBSIDIAN.ARTS repo        |
| `/admin/settings`             | admin         | Update your own profile                    |

## API surface (tRPC at `/api/trpc`)

- `auth.signup` / `auth.login` / `auth.logout` / `auth.me`
- `auth.updateProfile`
- `auth.adminListUsers` / `adminGetUser` / `adminUpdateUser` /
  `adminDeleteUser` / `adminStats`
- `commission.list` / `getById` / `create` / `update` / `delete` / `submit`
- `message.list` / `create` / `delete`
- `admin.getStats` / `listCommissions` / `getCommission` / `updateStatus` /
  `updateCommission` / `addEvent` / `replyToCommission` / `deleteCommission`
- `github.getRepo` / `listCommits` / `getCommit` / `listBranches` /
  `listIssues` / `getIssue` / `createIssue` / `updateIssue` /
  `commentOnIssue` / `listPulls` / `getPull` / `listReleases` /
  `getReadme` / `getFile` / `listFiles` / `syncReadme` / `pushFile` /
  `dispatchWebhook` / `recentActivity`

Plus:

- `GET  /api/health`
- `GET  /api/oauth/callback?code=...&unionId=...` — Kimi OAuth stub (dev)

## GitHub integration

The admin panel reads from and writes to the OBSIDIAN.ARTS GitHub repository
(`https://github.com/m-hassssssan/OBSIDIAN.ARTS`). Configure:

```bash
GITHUB_TOKEN=ghp_…           # Personal access token (repo scope)
GITHUB_OWNER=m-hassssssan
GITHUB_REPO=OBSIDIAN.ARTS
```

Then in the admin sidebar, click **GitHub** to:

- Read commits, branches, issues, PRs, releases, README
- Push edits to the README from the panel
- File issues against the repo
- Comment on existing issues
- Inspect any tracked file
- Trigger a webhook dispatch (e.g. to wake a CI)

## Environment variables

| Var                | Required | Default                          | Notes                                  |
| ------------------ | -------- | -------------------------------- | -------------------------------------- |
| `APP_ID`           | yes (prod) | —                              | Used as JWT issuer                     |
| `APP_SECRET`       | yes (prod) | —                              | JWT signing secret                     |
| `DATABASE_URL`     | yes      | —                                | MySQL connection string                |
| `OWNER_UNION_ID`   | no       | —                                | Union ID granted admin on first login  |
| `SESSION_TTL_SECONDS` | no    | 1209600 (14d)                    | Cookie lifetime                        |
| `GITHUB_TOKEN`     | no       | —                                | Enables GitHub integration             |
| `GITHUB_OWNER`     | no       | `m-hassssssan`                   |                                        |
| `GITHUB_REPO`      | no       | `OBSIDIAN.ARTS`                  |                                        |
| `PORT`             | no       | `3000`                           | Production port                        |

## Security notes

- Passwords are hashed with scrypt (N=16384, r=8, p=1, 16-byte salt, 64-byte key)
- Sessions are HS256 JWTs in an HttpOnly, SameSite=Lax (dev) / None-Secure (prod) cookie
- Role enforcement happens in two places: `authedQuery` middleware (logged in)
  and `adminQuery` middleware (`ctx.user.role === "admin"`)
- Login form accepts either email or `unionId`
