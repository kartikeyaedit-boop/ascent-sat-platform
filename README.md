# Ascent — SAT Prep Platform

A gamified, Khan Academy-inspired SAT prep platform: adaptive practice, full
digital SAT simulations, XP/levels/streaks/achievements, and deep Math &
English content. Built in phases — see [docs/roadmap.md](docs/roadmap.md)
for what's done vs. planned.

## Tech stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · shadcn/ui · Framer
Motion · React Query · Zustand · Prisma · PostgreSQL · JWT auth

## Project structure

```
apps/web/          Next.js app (frontend + API routes)
  src/app/          Pages & API route handlers
  src/components/   UI components
  src/server/       Domain/business logic (service layer)
  src/lib/          Cross-cutting utilities
  src/hooks/        React Query hooks
  src/services/     Typed API client wrappers
  src/stores/       Zustand stores
  prisma/           Schema, migrations, seed script
  tests/e2e/         Playwright end-to-end tests (unit tests are colocated
                      with source as *.test.ts)
docs/               Architecture, schema, API spec, roadmap, deployment
docker-compose.yml  Local Postgres (optional — a hosted Postgres like
                     Supabase works too, see below)
```

## Getting started

### 1. Install dependencies

```bash
cd apps/web
npm install
```

### 2. Set up the database

You need a PostgreSQL database. Either:

- **Local via Docker**: `docker compose up -d` from the repo root, then use
  the `DATABASE_URL` already in `.env.example` (matches the compose file).
- **Hosted (e.g. Supabase free tier)**: create a project, grab the pooled
  connection string for `DATABASE_URL` and the direct connection string for
  `DIRECT_URL` (Project → Connect → ORM → Prisma in the Supabase dashboard).

Copy the env file and fill in your values:

```bash
cp .env.example .env
```

Then run the migration and seed script:

```bash
npm run db:migrate
npm run db:seed
```

The seed script creates two accounts (email-verified, ready to log in):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@satplatform.dev` | `Admin123!` |
| Student | `student@satplatform.dev` | `Student123!` |

### 3. Run the app

```bash
npm run dev
```

Visit http://localhost:3000.

In development, no SMTP is required — verification/reset emails are logged
to the server console instead of actually being sent.

## Scripts (run from `apps/web`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests (starts its own dev server) |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:seed` | Seed the admin + demo student accounts |
| `npm run db:studio` | Open Prisma Studio |

## Environment variables

See [`apps/web/.env.example`](apps/web/.env.example) for the full list with
descriptions.

## Documentation

- [Architecture](docs/architecture.md)
- [Database schema](docs/database-schema.md)
- [API specification](docs/api-spec.md)
- [Roadmap](docs/roadmap.md)
- [Deployment guide](docs/deployment.md)
