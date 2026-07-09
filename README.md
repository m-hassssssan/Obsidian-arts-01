# OBSIDIAN ARTS

> **Live Production App → [obsidian-arts-01.vercel.app](https://obsidian-arts-01.vercel.app)**

A premium art studio platform for managing commissions, acquisitions, and patron communications.

---

## 🚀 Live

| Environment | URL |
|---|---|
| **Production** | [https://obsidian-arts-01.vercel.app](https://obsidian-arts-01.vercel.app) |

---

## 🛠 Stack

- **Frontend** — React 19, TypeScript, TailwindCSS, Vite
- **Backend** — Hono, tRPC, Drizzle ORM
- **Database** — MySQL (FreeDB)
- **Deployment** — Vercel (Serverless Node.js)

---

## 📦 Local Development

```bash
npm install
npm run dev
```

## 🗄 Database

```bash
npm run db:push     # push schema changes
npm run db:generate # generate migrations
```

## 🚢 Deploy

```bash
# Auto-deploys on every push to master via Vercel GitHub integration
git push origin master
```

Or manually:
```bash
npx vercel --prod
```

---

## 🔑 Seed Credentials (Dev)

| Email | Password | Role |
|---|---|---|
| `admin@obsidianarts.com` | `obsidian2026` | Admin |
| `elena@vasquez.studio` | `patron2026` | Patron |
| `marcus@chen.studio` | `patron2026` | Patron |
