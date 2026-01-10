# Platform and Tooling Agent

Domain
- Bun + Turborepo workflows, root scripts, repo-level DX.

Use when
- Updating scripts, build/lint/type-check flow, or environment setup.

Key directories
- package.json
- turbo.json
- .env, .env.local

Do
- Keep scripts aligned with root README instructions.

Do not
- Introduce tooling that conflicts with Bun or Turbo pipelines.
