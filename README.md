# ListMaker

Curate and organize the things you love online: save links into lists, enrich them with metadata, and optionally share lists publicly.

This repo is a Bun + Turborepo monorepo with:
- `apps/web`: Next.js 15 App Router web app (Clerk) + **BFF** API routes that proxy to the server
- `apps/server`: Express REST API (Clerk) + PostgreSQL (via `pg` queries)
- `apps/native`: Expo app (Clerk)
- `packages/*`: shared code (Prisma schema/seed, UI primitives, list defaults, optional tRPC scaffold)

## Project Structure

```
listmaker/
  apps/
    web/        # Next.js 15 App Router + BFF proxy routes
    server/     # Express REST API (Clerk + Postgres)
    native/     # Expo app (Clerk)
  packages/
    database/   # Prisma schema/client + seed tooling
    ui/         # Shared UI components (web)
    shared/     # Shared types/defaults (e.g. DEFAULT_LISTS)
    api/        # Minimal tRPC scaffolding (not the primary API)
  turbo.json
  package.json
  .env.example
  README.md
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) `1.1.38+`
- PostgreSQL database
- [Clerk](https://clerk.com) keys (web/server/native)

### 1) Install

```bash
bun install
```

### 2) Environment

Create a root `.env` (or `.env.local`) from `.env.example`.

Minimum for local web + server:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/listmaker?schema=public"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx

# Clerk redirects (web)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Server + BFF proxy
PORT=3001
CORS_ORIGIN=http://localhost:3000
SERVER_API_URL=http://localhost:3001
```

Notes:
- The server loads env from repo root (prefers `.env.local`, then `.env`).
- You can use either `DATABASE_URL` or discrete `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` (see `.env.example`).

### 3) Database (Prisma)

Prisma is the schema source-of-truth and is used for generation/seed; the Express server uses `pg` (SQL queries) at runtime.

```bash
bun db:generate
bun db:push
bun db:seed
```

### 4) Playwright (Pinterest ingestion)

Pinterest ingestion can fall back to Playwright; install browser binaries once:

```bash
bunx playwright install
```

### 5) Run

```bash
# Web + server (recommended for most work)
bun dev:web:server

# Or everything
bun dev
```

Local URLs:
- Web: `http://localhost:3000`
- Server: `http://localhost:3001` (`GET /health`)

## Architecture Notes

- **Web (BFF)**: The web app calls Next.js API routes under `apps/web/src/app/api/*`, which proxy requests to the Express server via `apps/web/src/lib/server-api.ts` and forward a Clerk session token.
- **Server (REST)**: Express routes live under `apps/server/src/routes/*` and controllers under `apps/server/src/controllers/*`.
- **Shared defaults**: Default list templates live in `packages/shared/src/lists.ts` and are created on the dashboard when a new user has zero lists.
- **Ingestion**: Creating an ingestion job is async; jobs transition through `queued → processing → completed|failed` and only create an `Item` after metadata extraction succeeds (and media exists: thumbnail or video).
- **Realtime (SSE)**: The web app includes an Edge runtime Server-Sent Events endpoint at `apps/web/src/app/api/realtime/events/route.ts` (heartbeat stream).

## REST API (Server)

The backend contract lives in `.codex/backend-spec.md` and is implemented in `apps/server`.

Key endpoints:
- `GET /health` (returns `{ status: "ok", timestamp: ... }`)
- Auth: `POST /api/auth/sync`, `GET /api/auth/me`
- Lists: `POST /api/lists`, `GET /api/lists`, `GET /api/lists/:id`, `PUT /api/lists/:id`, `DELETE /api/lists/:id`
- Items: `POST /api/items`, `GET /api/items/list/:listId`, `DELETE /api/items/:id`
- Ingestion: `POST /api/ingestions`, `GET /api/ingestions/:id`

## Scripts (root)

- Dev: `bun dev`, `bun dev:web`, `bun dev:web:server`, `bun dev:native`, `bun dev:native:server`, `bun dev:server`
- Checks: `bun lint`, `bun type-check`, `bun build`
- DB: `bun db:generate`, `bun db:push`, `bun db:migrate`, `bun db:migrate:deploy`, `bun db:seed`, `bun db:studio`, `bun db:reset`

## Docs (Codex + Workflows)

This repo keeps its internal “how we work” docs in `.codex/`:
- `.codex/README.md` (routing map)
- `.codex/repository-map.md` (key paths/entrypoints)
- `.codex/backend-spec.md` (REST contract)
- `.codex/usage-guide.md` (how to use the skills/agents/workflows)
- `.codex/workflows/*` (env setup, local dev, DB, testing, release)

## Troubleshooting

- Prisma client not found: `bun db:generate`
- Type errors: `bun type-check`
- Server can’t reach DB: verify `DATABASE_URL` (or `DB_*` vars) and Postgres is running

