# Listmaker Server (Express)

Express + TypeScript API for the list application, migrated into the monorepo. Uses Clerk auth and PostgreSQL.

## Scripts

- `bun dev:server` (or `bunx turbo run dev --filter=server`) - start with tsx watch.
- `bun run build --filter=server` - emit `dist/`.
- `bun run type-check --filter=server` - type check.

## Env

Uses root `.env`:

- `PORT` (default 3001)
- `CORS_ORIGIN` (comma-separated)
- `DATABASE_URL` or `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- Optional: `DISABLE_HELMET=true` to skip helmet (not recommended)

## Endpoints

- `GET /health`
- Auth: `POST /api/auth/sync`, `GET /api/auth/me`
- Lists: `POST /api/lists`, `GET /api/lists`, `GET /api/lists/:id`, `PUT /api/lists/:id`, `DELETE /api/lists/:id`
- Items: `POST /api/items`, `GET /api/items/list/:listId`, `DELETE /api/items/:id`
- Ingestion: `POST /api/ingestions`, `GET /api/ingestions/:id`

## Notes

- `packages/shared` contains shared list types and default lists used by web/native.
- The web app calls the server via Next.js API routes (BFF), forwarding Clerk session tokens. Ensure server and web run together via `bun dev:web:server` in local dev.
- Pinterest ingestion uses Playwright; install browsers with `bunx playwright install`.
