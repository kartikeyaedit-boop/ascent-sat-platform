# Deployment Guide

This covers deploying Phase 1 (auth + shell). Later phases don't change the
deployment shape, just add more env vars as they're introduced.

## Prerequisites

- A PostgreSQL database reachable from the deploy target (Supabase, Railway
  Postgres, Neon, RDS, etc.)
- The env vars from `apps/web/.env.example`, filled in with real values

## Option A — Vercel

1. Import the repo into Vercel, set the project root to `apps/web`.
2. Add the environment variables from `.env.example` (`DATABASE_URL`,
   `DIRECT_URL` if using a pooled Postgres like Supabase, `APP_URL` set to
   the production URL, `JWT_ACCESS_SECRET` set to a fresh random value, SMTP
   vars for real email delivery).
3. Build command: `npm run build` (from `apps/web`). Vercel auto-detects
   Next.js.
4. Run `npx prisma migrate deploy` against the production database once
   (locally with production env vars, or as a one-off Vercel build step)
   before the first deploy serves traffic.

## Option B — Railway

1. Create a Railway project, add a Postgres plugin (or point `DATABASE_URL`
   at an external one).
2. Deploy `apps/web` as a service; Railway can build straight from the
   Dockerfile (below) or via Nixpacks auto-detection.
3. Set the same env vars as above.
4. Run migrations via `railway run npx prisma migrate deploy`.

## Docker

A `Dockerfile` will be added alongside the Phase 10 deployment hardening
pass. Until then, `npm run build && npm run start` inside `apps/web` is the
production build/run path for any container or VM host.

## Database migrations in production

Always use `prisma migrate deploy` (not `migrate dev`) in production/CI — it
applies existing migrations without generating new ones or prompting.

## Secrets

- `JWT_ACCESS_SECRET` must be a long random value, different per environment,
  and never committed (see `.gitignore`).
- Rotating it invalidates all existing access tokens (refresh tokens still
  work and will mint new access tokens on next use).
