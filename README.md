# ListMaker - Modern listmaking application for keeping track of everything you love online.

A full-stack list keeping platform built with Bun, Turborepo, Next.js 15, tRPC, Prisma, Clerk authentication, and an Express backend.

## Project Structure

```
listmaker/
├─ apps/
│  ├─ web/             # Next.js 15 App Router BFF (Clerk auth, REST proxy to server)
│  ├─ native/          # Expo app (Clerk)
│  └─ server/          # Express REST API (Clerk, PostgreSQL)
├─ packages/
│  ├─ database/        # Prisma schema and client
│  ├─ ui/              # Shared UI components (ShadCN-based)
│  └─ shared/          # Shared types/constants (Lists, defaults, etc.)
├─ package.json
├─ turbo.json
└─ README.md
```

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.1.38 or higher
- PostgreSQL database
- [Clerk](https://clerk.com) account for authentication

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Setup

Create a root `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/listmaker?schema=public"

# Clerk (web + server + native)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

### 3. Database Setup

```bash
# Generate Prisma client
bun db:generate

# Push schema to database
bun db:push

# Seed database with sample data
bun db:seed
```

### 4. Run Development Servers

```bash
# All apps
bun dev

# Web only
bun dev:web

# Web + server
bun dev:web:server

# Native only
bun dev:native

# Native + server
bun dev:native:server

# Server only
bun dev:server
```

The application will be available at:
- **Web App**: http://localhost:3000 (BFF proxies to http://localhost:3001)

## Available Scripts (root)

- `bun dev` - Start all apps in development mode
- `bun dev:web` - Start only the Next.js web app
- `bun dev:web:server` - Start web + Express server together
- `bun dev:native` - Start only the Expo native app
- `bun dev:native:server` - Start native + Express server together
- `bun dev:server` - Start only the Express server
- `bun build` - Build all apps and packages
- `bun lint` - Lint all packages
- `bun type-check` - Type check all packages

## Features

### Authentication
- Clerk-based authentication across web, native, and server
- Protected routes (dashboard)
- Automatic user sync on first sign-in via `/api/auth/sync`

### Lists
- Default lists defined in `packages/shared/src/lists.ts` and created on first dashboard load if missing
- Lists are clickable; detail pages fetch list + items via the BFF (`/api/lists/:id`, `/api/items/list/:listId`)

### Database Models
- **User**: Clerk ID, email (synced from Clerk), display name, profile photo
- **List**: Title, description, privacy, cover image
- **Item**: URL metadata, position, optional scraped fields

### API
- Express REST backend for users, lists, and items (see backend docs in `docs/server-docs`)
- Next.js API routes act as a BFF, proxying to the Express server with Clerk session tokens

### UI Components
- ShadCN-based components (Button, Card, etc.)
- React Native Reusables for Native UI
- Shared list types/defaults live in `packages/shared`

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk
- **Database**: PostgreSQL + Prisma
- **API**: Express REST backend (consumed via Next.js BFF)
- **Serialization**: SuperJSON
- **Package Manager**: Bun
- **Monorepo**: Turborepo

## Pages

- `/` - Landing page with authentication
- `/dashboard` - User dashboard with lists
- `/dashboard/lists/[id]` - List detail (items)

## Development Tips

1. **Adding a new API route**: Follow the backend spec for users, lists, and items (see `docs/server-docs`)
2. **Database changes**: Update `packages/database/prisma/schema.prisma`, then run `bun db:push`
3. **New UI component**: Add to `packages/ui/src/components/`
4. **Environment variables**: Add to `.env.example` at the repo root

## Troubleshooting

### Prisma Client Not Found
```bash
cd packages/database
bun db:generate
```

### Type Errors
```bash
bun type-check
```

### Database Connection Issues
- Verify `DATABASE_URL` in the root `.env`
- Ensure PostgreSQL is running
- Check connection string format

## License

MIT

## Contributing

This is a monorepo setup - make sure to install dependencies at the root level using `bun install`.

## Codex Usage Guide

See `docs/codex-guide.md` for the Codex skills, agents, and workflows used in this repo.
