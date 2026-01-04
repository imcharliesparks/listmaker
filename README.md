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

Create `.env` files in the following locations:

**`packages/database/.env`**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/listmaker?schema=public"
```

**`apps/web/.env.local`**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/listmaker?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
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
- Protected routes (dashboard, admin)
- Automatic user creation with 10,000 starting chips

### Database Models
- **User**: Clerk ID, email, username, role, balance

### tRPC API Routes

*NOTE: These routes need to be removed and are brought over from a similar project
#### Wallet Router
- `wallet.getBalance` - Get user balance
- `wallet.getTransactions` - Get transaction history (paginated)

#### Bets Router
- `bets.place` - Place a new bet
- `bets.list` - List user bets (with filtering)
- `bets.getById` - Get specific bet details
- `bets.cancel` - Cancel a pending bet

#### Matches Router
- `matches.getAvailable` - Get upcoming/live matches
- `matches.getById` - Get match details
- `matches.list` - List all matches (with filtering)
- `matches.getOdds` - Get match odds

#### Admin Router (Admin only)
- `admin.createMatch` - Create new match
- `admin.updateMatch` - Update match details
- `admin.deleteMatch` - Delete match (if no bets)
- `admin.settleMatch` - Settle match and process payouts
- `admin.importPlaceholder` - Placeholder for data import

### Real-time Features
- SSE endpoint at `/api/realtime/events` with heartbeat

### UI Components
- `MatchCard` - Display match with betting options
- `LiveMatchCard` - Display live match (betting disabled)
- ShadCN-based components (Button, Card, etc.)
- React Native Reusables for Native UI

## 🎨 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk
- **Database**: PostgreSQL + Prisma
- **API**: tRPC with React Query
- **Serialization**: SuperJSON
- **Package Manager**: Bun
- **Monorepo**: Turborepo

## 📝 Database Schema

### User
- Auto-created on first login
- Starting balance: 10,000 chips
- Roles: USER, ADMIN

### Match
- Status: UPCOMING, LIVE, FINISHED, CANCELLED
- Odds for home/away/draw
- Settlement tracking

### Bet
- Status: PENDING, WON, LOST, CANCELLED, REFUNDED
- Automatic balance deduction on placement
- Automatic payout on win

### Transaction
- Types: DEPOSIT, WITHDRAWAL, BET_PLACED, BET_WON, BET_REFUND
- Complete audit trail

## 🔐 Security

- Clerk middleware protects `/dashboard/*` and `/admin/*` routes
- Role-based access control for admin functions
- Server-side validation on all tRPC procedures
- Protected database mutations

## 🌐 Pages

- `/` - Landing page with authentication
- `/dashboard` - User dashboard with match listings and betting
- `/admin` - Admin dashboard with match management (server-rendered)

## 📚 Development Tips

1. **Adding a new tRPC route**: Create in `apps/web/src/lib/trpc/routers/`
2. **Database changes**: Update `packages/database/prisma/schema.prisma`, then run `bun db:push`
3. **New UI component**: Add to `packages/ui/src/components/`
4. **Environment variables**: Add to both `.env.example` files

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
- Verify `DATABASE_URL` in both `.env` files
- Ensure PostgreSQL is running
- Check connection string format

## 📄 License

MIT

## 🤝 Contributing

This is a monorepo setup - make sure to install dependencies at the root level using `bun install`.
