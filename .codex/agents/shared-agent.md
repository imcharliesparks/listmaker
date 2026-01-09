# Shared Packages Agent

Domain
- Shared UI components and shared types/defaults.

Use when
- Updating packages/ui or packages/shared exports and contracts.

Key directories
- packages/ui/src
- packages/shared/src

Do
- Keep exports stable; add new exports rather than breaking ones.

Do not
- Remove existing shared types without migration.
