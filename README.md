# Cadence — AI Public Speaking Coach

An AI speaking coach that listens through your microphone and gives real,
explained feedback in real time — confidence, clarity, pace, filler words,
vocal variety — plus a personalized coaching report after every session.
Built in phases; see [docs/roadmap.md](docs/roadmap.md) for what's done vs.
planned.

## Tech stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · shadcn/ui · Framer
Motion · React Query · Zustand · Prisma · PostgreSQL · JWT auth · browser
Speech Recognition API (live speech-to-text, no key needed) · rule-based
coaching engine (no LLM API, no key needed)

## Project structure

```
apps/web/
  src/app/          Pages & API route handlers
  src/components/   UI, organized by feature (layout, marketing, auth,
                     practice, reports)
  src/server/       Domain logic (auth/, speech/)
  src/lib/          Cross-cutting utilities, incl. speech-metrics.ts
                     (the scoring math — pure functions, used both
                     client-side for live scores and server-side as the
                     source of truth)
  src/hooks/        React Query hooks + use-speech-session.ts (the
                     mic → Speech Recognition → live-metrics state machine)
  prisma/           Schema, migrations, seed script
  tests/e2e/        Playwright E2E tests (unit tests are colocated with
                     source as *.test.ts)
docs/               Architecture, schema, API spec, roadmap, deployment
```

## Getting started

### 1. Install dependencies

```bash
cd apps/web
npm install
```

### 2. Set up the database

Copy the env file and fill in your values:

```bash
cp .env.example .env
```

You need a PostgreSQL connection string (`DATABASE_URL`/`DIRECT_URL` —
Supabase's pooled + direct connection strings work well), a
`JWT_ACCESS_SECRET`, and a `RESEND_API_KEY` for real email delivery
(optional in dev — without it, verification/reset emails are logged to the
console instead of sent). Speech features need no configuration at all —
see [docs/architecture.md](docs/architecture.md) for why.

Then run the migration and seed script:

```bash
npm run db:migrate
npm run db:seed
```

Seed creates two email-verified accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@satplatform.dev` | `Admin123!` |
| Student | `student@satplatform.dev` | `Student123!` |

### 3. Run the app

```bash
npm run dev
```

Visit http://localhost:3000.

## Scripts (run from `apps/web`)

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests (builds + starts its own prod server) |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:seed` | Seed demo accounts |
| `npm run db:studio` | Open Prisma Studio |

## Documentation

- [Architecture](docs/architecture.md) — including why speech features run
  entirely on free, keyless browser APIs instead of paid services
- [Database schema](docs/database-schema.md)
- [API specification](docs/api-spec.md)
- [Roadmap](docs/roadmap.md)
- [Deployment guide](docs/deployment.md)
