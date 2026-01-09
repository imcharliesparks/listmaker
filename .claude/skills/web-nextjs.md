# Web (Next.js 15 + Clerk)

Scope
- App Router pages, API routes (BFF), Clerk auth flows, dashboard UX.

Key paths
- apps/web/src/app/*
- apps/web/src/lib/server-api.ts
- apps/web/src/middleware.ts

Common tasks
- Add or update App Router pages under `apps/web/src/app`.
- Adjust BFF proxy handling in `apps/web/src/lib/server-api.ts`.
- Update dashboard list loading and sync behavior in `apps/web/src/app/dashboard/page.tsx`.
- Maintain Edge/SSE API routes under `apps/web/src/app/api` (see realtime events).

Guardrails
- Keep server calls routed through the BFF API routes when possible.
- Preserve Clerk auth flow; ensure a valid session token for server calls.
- Respect `DEFAULT_LISTS` in `packages/shared/src/lists.ts` when changing onboarding.
- For Edge runtime routes, avoid Node-only APIs and keep streaming responses compatible with `text/event-stream`.
