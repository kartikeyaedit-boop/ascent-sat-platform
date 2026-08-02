# Architecture

## Overview

Ascent is a single Next.js 15 (App Router) application that serves both the
frontend and the backend API (via Route Handlers). This keeps the whole
product as one deployable unit — simplest to run locally, simplest to deploy
to Vercel or Railway — while still keeping a clean separation between HTTP
concerns and business logic.

```
Browser
  │
  ├─ React Server Components (pages, layouts)
  ├─ Client Components (interactive UI) ── React Query ── fetch ──┐
  │                                                                │
  └──────────────────────────────────────────────────────────────▼
                                                    Next.js Route Handlers
                                                    (src/app/api/**)
                                                            │
                                                    Zod validation
                                                            │
                                                    Service layer
                                                    (src/server/**)
                                                            │
                                                    Prisma Client
                                                            │
                                                        PostgreSQL
```

## Layering

- **`src/app/**`** — pages (Server Components by default) and API route
  handlers. Route handlers are thin: validate input with Zod, call a service
  function, translate the result/error into an HTTP response via
  `src/lib/api-handler.ts`.
- **`src/server/**`** — domain/business logic, organized by domain (e.g.
  `server/auth/`). No knowledge of HTTP — functions take/return plain data
  and throw `AppError` on failure. This is what's unit tested.
- **`src/lib/**`** — cross-cutting utilities: the Prisma client singleton,
  env validation, the API response helpers, rate limiting, server-side auth
  helpers.
- **`src/components/**`** — UI. `components/ui` is shadcn/ui primitives;
  everything else is organized by feature area (`layout`, `marketing`,
  `auth`, and — starting Phase 2 — `gamification`, `questions`, `charts`).
- **`src/hooks/**`**, **`src/services/**`**, **`src/stores/**`** — the
  client-side data layer. `services/*` are typed fetch wrappers,
  `hooks/*` wrap them in React Query, `stores/*` (Zustand) hold client-only
  UI state that isn't naturally server state (e.g. the current user, mirrored
  from React Query for easy access without prop drilling).

## Auth model

JWT access token (15 min, `jose`, HS256) + rotating opaque refresh token (30
days, random 256-bit value, only its SHA-256 hash is stored). Both live in
httpOnly, `SameSite=Lax` cookies.

- **Login/refresh** issue a new access+refresh pair; refreshing revokes the
  used refresh token and issues a new one (rotation — a stolen, already-used
  refresh token becomes invalid).
- **Middleware** (`src/middleware.ts`) only checks whether a refresh-token
  cookie is *present*, purely to avoid a flash of authenticated UI for
  logged-out users. It cannot verify the token because Next.js Middleware
  runs on the Edge runtime, which can't run Prisma.
- **Real enforcement** happens per-request in Node.js runtime code:
  `requireUser()` (`src/lib/auth-server.ts`) in every protected Server
  Component and API route actually verifies the JWT and loads the user.
- **Client-side 401 handling**: `src/lib/api-client.ts` automatically calls
  `/api/auth/refresh` once and retries on a 401, so an expired access token
  is invisible to the user during normal API-driven interaction. A fully
  expired session (refresh token also gone) still requires a fresh full-page
  login, since Server Components can only *read* cookies, not refresh them.
- Email verification and password reset use the same opaque-token pattern
  (hash stored, raw value emailed), with short expiries (24h / 1h).

## Why these specific libraries

- **`jose`** instead of `jsonwebtoken` for the access token: `jsonwebtoken`
  depends on Node's `crypto` module in a way that doesn't run on the Edge
  runtime; `jose` is Web Crypto-based and works in both, keeping the door
  open if middleware-level verification is ever needed.
- **Prisma pinned to 6.x**, not the newly-released 7.x: v7 changed generator
  defaults significantly; 6.x is the well-documented, stable line.
- **Next.js pinned to 15.x**, not 16: the spec calls for Next 15, and 16 has
  breaking changes relative to it.

## Error handling contract

Every API response is either `{ data: T }` or `{ error: { code, message } }`.
Route handlers are wrapped in `withErrorHandling` (`src/lib/api-handler.ts`),
which catches `AppError` (expected, typed domain errors — see
`src/lib/errors.ts`) and `ZodError` (validation failures) and maps them to
the right HTTP status; anything else becomes a logged 500.
