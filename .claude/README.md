# Codex Repo Guide

Use this folder as the routing map for how Codex should work in this repo.

Usage Guide:
- Usage of all skills, agents, and workflows: .codex/usage-guide.md

Core references:
- Backend API contract: .codex/backend-spec.md
- Monorepo layout: .codex/repository-map.md

When deciding where to work:
- Web UI or BFF proxy: .codex/agents/web-agent.md and .codex/skills/web-nextjs.md
- Express API or metadata scraping: .codex/agents/backend-agent.md and .codex/skills/backend-express.md
- Database schema or data alignment: .codex/agents/data-agent.md and .codex/skills/data-prisma.md
- Shared types/UI packages: .codex/agents/shared-agent.md and .codex/skills/shared-ui.md
- Native app work: .codex/agents/native-agent.md and .codex/skills/native-expo.md
- tRPC package work: .codex/agents/api-agent.md and .codex/skills/trpc-api.md
- Tooling and repo-level dev flow: .codex/agents/platform-agent.md and .codex/workflows/local-dev.md

Operational workflows:
- Environment setup: .codex/workflows/env-setup.md
- Local development: .codex/workflows/local-dev.md
- Database workflow: .codex/workflows/database.md
- Testing and checks: .codex/workflows/testing.md
- Release checklist: .codex/workflows/release.md
