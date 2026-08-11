# Deploying to Vercel

The frontend (Vite/React) and backend (Express + Prisma, under `server/`) deploy
together as **one Vercel project**. The backend runs as a single serverless
function (`api/[...path].ts`, a catch-all that wraps the same Express app used
locally) and talks to a managed Postgres database — there is no WebSocket and no
in-process state, so it's fully compatible with Vercel's stateless functions.

## 1. Provision a Postgres database

Any managed Postgres works. Free tiers that work well with Prisma + serverless:

- [Neon](https://neon.tech) — recommended, has a pooled connection string built in
- [Supabase](https://supabase.com)
- Vercel Postgres (via the Vercel dashboard's Storage tab)

Copy the connection string. **Use the pooled/pgbouncer variant if the provider
offers one** (Neon and Supabase both do) — serverless functions open a lot of
short-lived connections, and an unpooled connection string will exhaust
Postgres's connection limit under load.

## 2. Run the migration once against that database

From your machine, with the real `DATABASE_URL`:

```bash
cd server
DATABASE_URL="<your production connection string>" npx prisma migrate deploy
DATABASE_URL="<your production connection string>" npm run seed   # optional: seeds the two starter notices
```

`migrate deploy` only applies migrations — it never generates new ones or touches
your schema, so it's safe to run against production.

## 3. Push the repo to GitHub (if it isn't already)

Vercel deploys from a Git repository.

## 4. Import the project in Vercel

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo.
2. Vercel will detect `vercel.json` at the project root, which already configures:
   - `installCommand`: installs both the root (frontend) and `server/` dependencies
   - `buildCommand`: generates the Prisma client, then builds the Vite frontend
   - `outputDirectory`: `dist`
   - a rewrite so client-side routing (React Router) works on refresh/deep links
3. Don't change the framework preset away from what `vercel.json` implies —
   leave build settings on "Other" / as detected from the config file.

## 5. Set environment variables (Vercel project → Settings → Environment Variables)

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | your pooled Postgres connection string | same one used for the migration |
| `JWT_SECRET` | a long random string | generate with `openssl rand -hex 32`; **do not reuse the dev value in `server/.env`** |
| `CORS_ORIGIN` | your Vercel deployment URL, e.g. `https://your-app.vercel.app` | defensive — same-origin requests don't need CORS at all, but the Express app expects this var to be set |

**Do not set `VITE_API_URL`.** Leaving it unset makes the frontend call `/api/*`
as a same-origin relative path, which is correct once frontend and backend are
served from the same Vercel domain. (`VITE_API_URL` is only for local dev, where
the frontend on :5173 and backend on :8787 are different origins.)

## 6. Deploy

Trigger a deploy (push to the connected branch, or click Deploy in the dashboard).

## Local development vs. production

| | Local dev | Vercel |
|---|---|---|
| Backend process | `cd server && npm run dev` (long-running Node, `app.listen()`) | `api/[...path].ts` (same Express app, invoked per-request) |
| Database | Local Postgres (see `server/.env`) or any dev Postgres | Managed Postgres via `DATABASE_URL` |
| Online PVP transport | HTTP polling (same in both) | HTTP polling |
| Frontend → API | `http://localhost:8787` (`VITE_API_URL`) | same-origin `/api/*` (`VITE_API_URL` unset) |

## Known limitations of this deployment shape

- **Matchmaking latency**: moves and opponent matching are polled (~1s and ~1.2s
  intervals respectively), not pushed — there's no WebSocket on Vercel serverless.
  This is a deliberate trade-off to avoid depending on a third-party realtime
  service; see `src/hooks/useOnlineShogiGame.ts`.
- **Cold starts**: the first request to the API after a period of inactivity may
  take a moment while the serverless function spins up.
- **CPU search runs on the main thread**: the minimax engine (`src/game/ai/minimax.ts`)
  runs client-side, synchronously, within its time budget (up to ~1.4s on
  "매우 어려움"/expert). This briefly blocks the tab's UI thread by design — no
  Web Worker was added for this — rather than adding build complexity for a
  portfolio-scope feature.
