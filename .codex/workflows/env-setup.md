# Environment Setup

Prereqs
- Bun 1.1.38+
- PostgreSQL
- Clerk account

Root env files
- Create `.env` (or `.env.local`) at repo root based on `.env.example`.
- Required values: `DATABASE_URL`, Clerk publishable/secret keys, and web/native URLs.

Database
- `bun db:generate`
- `bun db:push`
- `bun db:seed`
