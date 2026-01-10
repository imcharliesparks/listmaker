# tRPC Package (Scaffold)

Scope
- tRPC router setup, context wiring, and procedure auth rules.

Key paths
- packages/api/src/server.ts
- packages/api/src/root.ts
- packages/api/src/context.ts

Common tasks
- Add routers and procedures under `packages/api/src/root.ts`.
- Use `protectedProcedure` for routes that require a Clerk-backed session.
- Extend Context types to include new dependencies.

Guardrails
- Keep `protectedProcedure` and `adminProcedure` auth semantics intact.
- Do not introduce router logic that assumes browser-only APIs.
