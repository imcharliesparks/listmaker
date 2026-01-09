# Backend (Express + pg + Clerk)

Scope
- Express routes/controllers, auth guard, DB access, URL metadata scraping.

Key paths
- apps/server/src/index.ts
- apps/server/src/routes/*
- apps/server/src/controllers/*
- apps/server/src/middleware/auth.ts
- apps/server/src/config/database.ts
- apps/server/src/services/urlMetadataService.ts

Common tasks
- Add or modify REST endpoints in `apps/server/src/routes`.
- Implement controller logic with pg pool queries.
- Update URL metadata scraping and SSRF protections.

Guardrails
- Always require Clerk auth on protected routes.
- Keep list/item ownership checks consistent with existing patterns.
- Maintain SSRF protections in `ensureSafeUrl` when touching URL metadata logic.
