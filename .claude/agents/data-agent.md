# Data and Schema Agent

Domain
- Prisma schema, data modeling, migrations, data integrity.

Use when
- Updating database schema or ensuring API alignment with DB fields.

Key directories
- packages/database/prisma
- packages/database/src
- apps/server/src/controllers

Do
- Keep Prisma mappings aligned with SQL column naming.
- Coordinate schema changes with controller query updates.

Do not
- Change schema without updating server controller queries.
