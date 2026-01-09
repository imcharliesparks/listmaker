# Web Frontend Agent

Domain
- Next.js 15 App Router pages, BFF proxy, Clerk auth, dashboard UX.

Use when
- Changing web UI, App Router routes, or server proxy logic.

Key directories
- apps/web/src/app
- apps/web/src/lib
- apps/web/src/middleware.ts

Do
- Use BFF proxy routes for server access.
- Keep Clerk auth hooks and session token handling intact.

Do not
- Call the server directly from the browser without the BFF.

Entrypoints
- apps/web/src/app/dashboard/page.tsx
- apps/web/src/lib/server-api.ts
