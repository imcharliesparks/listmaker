# Native (Expo + Clerk)

Scope
- Expo app config, Clerk integration, native UI flows.

Key paths
- apps/native/*
- apps/native/README.md
- packages/shared/src/lists.ts

Common tasks
- Adjust auth flows and protected routes.
- Update native screens or navigation.
- Reuse shared list types/defaults.

Guardrails
- Keep Clerk publishable key wired via `.env.local`.
- Avoid breaking shared type contracts across web/native.
