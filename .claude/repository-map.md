# Repository Map

Monorepo layout (Bun + Turborepo):

apps/
- web/ - Next.js 15 App Router web app and BFF API routes.
- server/ - Express REST API, Clerk auth, pg database access.
- native/ - Expo app with Clerk auth and shared types.

packages/
- shared/ - Shared list types/defaults used by web and native.
- ui/ - Shared UI primitives (ShadCN-based) for web.
- database/ - Prisma schema and client tooling.
- api/ - tRPC scaffolding (minimal, optional).

Root config:
- package.json, turbo.json - script entrypoints and task pipeline.
- .env / .env.local - runtime secrets and DB settings.

Key cross-cutting files:
- apps/web/src/lib/server-api.ts - BFF proxy helper to server.
- apps/web/src/app/api/realtime/events/route.ts - Edge runtime SSE endpoint.
- apps/server/src/services/urlMetadataService.ts - URL metadata scraping with SSRF protections.
- packages/database/prisma/schema.prisma - source of truth for DB models.
- packages/api/src/server.ts - tRPC router/procedure scaffolding.
