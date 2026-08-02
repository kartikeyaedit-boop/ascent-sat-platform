# Deployment Guide

## Prerequisites

- A PostgreSQL database (Supabase used in development/production so far)
- The env vars from `apps/web/.env.example`, filled in with real values —
  including `RESEND_API_KEY` (email) and, from Phase 1 onward,
  `DEEPGRAM_API_KEY` and `ANTHROPIC_API_KEY`

## Vercel (current deploy target)

1. Import the repo, project root set to `apps/web`.
2. **Framework Preset must be "Next.js"** — if Vercel ever auto-detects
   "Other" (can happen if the first import happens before Root Directory is
   set correctly), fix it under Settings → General → Framework Settings, or
   every route will 404 at the platform level even though the build
   succeeds. This bit us once already.
3. Root Directory: `apps/web`.
4. Add all env vars from `.env.example`, with `APP_URL` set to the
   production domain.
5. **Email must use Resend's HTTP API (`RESEND_API_KEY`), not SMTP** —
   outbound SMTP (port 587/465) is blocked on Vercel's serverless
   functions. `src/server/auth/mailer.ts` already prefers the HTTP API
   automatically when `RESEND_API_KEY` is set.
6. Check Settings → Deployment Protection → "Vercel Authentication" is
   **off** for the domain you want publicly reachable — it's on by default
   for some plans and will make every route look like a 404 to logged-out
   visitors.
7. Run `npx prisma migrate deploy` against production once before serving
   traffic (or as part of the build if you wire that up later).

## Database migrations in production

Always `prisma migrate deploy` (not `migrate dev`) — applies existing
migrations without prompting or generating new ones.

## Secrets

- `JWT_ACCESS_SECRET`: long random value, unique per environment.
- `DEEPGRAM_API_KEY` / `ANTHROPIC_API_KEY`: server-side only, never exposed
  to the client. The browser gets a short-lived, scoped Deepgram token
  minted by `/api/speech/token` — never the permanent key.
