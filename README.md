# ListMaker - Modern listmaking application for keeping track of everything you love online.

A full-stack list keeping platform built with Bun, Turborepo, Next.js 15, tRPC, Prisma, and Clerk authentication.

## 🏗️ Project Structure

```
listmaker/
├── apps/
│   └── web/                    # Next.js 15 App Router application
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # React components
│       │   └── lib/           # tRPC setup and utilities
│       └── package.json
├── packages/
│   ├── database/              # Prisma schema and client
│   │   ├── prisma/
│   │   └── src/
│   └── ui/                    # Shared UI components (ShadCN-based)
│       └── src/
├── package.json
├── turbo.json
└── README.md
```

## 🚀 Quick Start

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

# Clerk (web)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk (expo)
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

### 4. Run Development Server

```bash
bun dev
```

The application will be available at:
- **Web App**: http://localhost:3000

## 📦 Available Scripts

### Root Level

- `bun dev` - Start all apps in development mode
- `bun dev:web` - Start only the Next.js web app
- `bun dev:native` - Start only the Expo native app
- `bun build` - Build all apps and packages
- `bun lint` - Lint all packages
- `bun type-check` - Type check all packages

### Database Package

- `bun db:generate` - Generate Prisma client
- `bun db:push` - Push schema changes to database
- `bun db:studio` - Open Prisma Studio
- `bun db:seed` - Seed database with sample data

### Web App

- `bun dev` - Start Next.js dev server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun lint` - Lint the application

## 🔑 Features

### Authentication
- Clerk-based authentication
- Protected routes (dashboard)
- Automatic user sync on first sign-in

### Database Models
- **User**: Clerk ID, email, display name, profile photo
- **List**: Title, description, privacy, cover image
- **Item**: URL metadata, position, optional scraped fields

### API
- REST backend for users, lists, and items (see backend spec)

### UI Components
- ShadCN-based components (Button, Card, etc.)
- React Native Reusables for Native UI

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk
- **Database**: PostgreSQL + Prisma
- **API**: Express REST backend (see backend spec)
- **Serialization**: SuperJSON
- **Package Manager**: Bun
- **Monorepo**: Turborepo

## 📝 Database Schema

### User
- Auto-created on first login
- Stores Clerk ID, email, and profile details

### List
- Title, description, privacy flag, optional cover image

### Item
- URL metadata, source type, and ordering position

## 🔐 Security

- Clerk middleware protects `/dashboard/*` routes
- Protected database mutations

## 🌐 Pages

- `/` - Landing page with authentication
- `/dashboard` - User dashboard with lists and items

## 📚 Development Tips

1. **Adding a new API route**: Follow the backend spec for users, lists, and items
2. **Database changes**: Update `packages/database/prisma/schema.prisma`, then run `bun db:push`
3. **New UI component**: Add to `packages/ui/src/components/`
4. **Environment variables**: Add to `.env.example` at the repo root

## 🐛 Troubleshooting

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

## 📄 License

MIT

## 🤝 Contributing

This is a monorepo setup - make sure to install dependencies at the root level using `bun install`.
