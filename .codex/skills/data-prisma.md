# Data (PostgreSQL + Prisma)

Scope
- Prisma schema changes, alignment with server controllers, data integrity.

Key paths
- packages/database/prisma/schema.prisma
- packages/database/src/seed.ts
- apps/server/src/controllers/*

Common tasks
- Add fields or tables in Prisma schema and align server queries.
- Ensure controller inserts/updates map to schema column names.
- Update seed data when defaults change.

Guardrails
- Keep Prisma field mappings consistent with SQL column names.
- Verify list/item ownership checks still match the schema.
