# Backend API Agent

Domain
- Express routes/controllers, pg access, auth guards, URL metadata scraping.

Use when
- Changing server endpoints, DB access, or SSRF-safe scraping behavior.

Key directories
- apps/server/src/controllers
- apps/server/src/routes
- apps/server/src/services
- apps/server/src/config

Do
- Keep auth checks in controllers consistent with Clerk `getAuth`.
- Validate list and item ownership before mutations.

Do not
- Remove SSRF protections in URL metadata service.
- Introduce unbounded network calls without timeouts.

Entrypoints
- apps/server/src/index.ts
- apps/server/src/services/urlMetadataService.ts
