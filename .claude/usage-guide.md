# Codex Guide

This guide summarizes the Codex docs available in this repo and how to use them in daily work.

Overview
- Router and map: `.codex/README.md`, `.codex/repository-map.md`
- Backend contract: `.codex/backend-spec.md`

Skills (when to consult)
- Web (Next.js + Clerk): `.codex/skills/web-nextjs.md` for App Router, BFF proxy, and Edge/SSE routes.
- Backend (Express + pg): `.codex/skills/backend-express.md` for controllers, auth guards, and metadata scraping.
- Data (Prisma + Postgres): `.codex/skills/data-prisma.md` for schema changes and controller alignment.
- Native (Expo + Clerk): `.codex/skills/native-expo.md` for mobile flows and shared types.
- Shared packages: `.codex/skills/shared-ui.md` for UI primitives and shared list defaults.
- tRPC scaffolding: `.codex/skills/trpc-api.md` for routers, context, and procedures.

Agents (who to use)
- Web agent: `.codex/agents/web-agent.md` for web UI and BFF/API routes.
- Backend agent: `.codex/agents/backend-agent.md` for server routes, DB access, SSRF-safe scraping.
- Data agent: `.codex/agents/data-agent.md` for Prisma schema and data integrity.
- Native agent: `.codex/agents/native-agent.md` for Expo screens and auth wiring.
- Shared agent: `.codex/agents/shared-agent.md` for shared UI and types.
- Platform agent: `.codex/agents/platform-agent.md` for scripts, Turbo, env, and DX.
- API agent: `.codex/agents/api-agent.md` for tRPC scaffolding work.

Workflows (how to run)
- Environment setup: `.codex/workflows/env-setup.md`
- Local dev: `.codex/workflows/local-dev.md`
- Database: `.codex/workflows/database.md`
- Testing: `.codex/workflows/testing.md`
- Release: `.codex/workflows/release.md`

How to integrate into development
1) Scope the task
   - Identify the area (web, server, data, native, shared, tooling, or tRPC).
   - Open the matching agent doc to confirm responsibilities and guardrails.
2) Load the skill
   - Open the matching skill doc for paths, patterns, and constraints.
   - Use the key entrypoints listed to avoid missing critical files.
3) Follow the workflow
   - For env or DB changes, follow the workflow docs before coding.
   - For app changes, ensure `SERVER_API_URL` and Clerk keys match the target app.
4) Verify and align
   - If touching data, confirm Prisma schema and server queries stay aligned.
   - If touching API behavior, cross-check `.codex/backend-spec.md`.
5) Run checks
   - Use `.codex/workflows/testing.md` for repo-wide checks.
   - Use `.codex/workflows/local-dev.md` for the correct dev scripts.

Quick routing by task
- UI or App Router change: web agent + web skill, then local-dev workflow.
- New API endpoint or behavior: backend agent + backend skill, then backend-spec.md.
- Schema change: data agent + data skill, then database workflow.
- Native change: native agent + native skill, then local-dev workflow.
- Shared types or components: shared agent + shared skill.
- tRPC scaffolding changes: API agent + tRPC skill.
