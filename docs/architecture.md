# Architecture

## Overview

Cadence is a single Next.js 15 (App Router) application serving both the
frontend and the backend API (via Route Handlers) — the same shape as
before the pivot, since that decision had nothing to do with the product
being SAT prep specifically.

The one architecturally interesting problem this product has that a
typical CRUD app doesn't: **real-time audio feedback while the user is
speaking**, on a platform (Vercel) whose serverless functions can't hold
long-lived connections.

```
Browser mic
  ├─ Web Audio API (AnalyserNode) ── local pitch/volume sampling, no network
  └─ Audio stream ──────────────────► Deepgram Live WebSocket (DIRECT, browser-to-Deepgram)
                                              │
                                       live transcript + word timestamps
                                              │
                                              ▼
                                   Browser computes live WPM / filler
                                   words / pauses from word timestamps
                                   (pure functions, src/lib/speech-metrics.ts)
                                              │
                              on stop: full transcript + computed metrics
                                              │
                                              ▼
                                   POST /api/speech/sessions (Next.js)
                                              │
                              stores session, recomputes metrics
                              server-side (authoritative), calls Claude
                              for qualitative coaching feedback
                                              │
                                              ▼
                                   Full report returned to browser
```

The browser streams audio **directly** to Deepgram's WebSocket API using a
short-lived, scoped token minted by our backend (`POST /api/speech/token`)
— our server is never in the audio path, and the permanent Deepgram key
never reaches the client. This sidesteps building any WebSocket
infrastructure of our own, which Vercel's serverless model doesn't support
well anyway.

`src/lib/speech-metrics.ts` is a shared, pure-function module (no I/O),
used both client-side (for live in-progress scores while speaking) and
server-side (to authoritatively recompute the final scores that actually
get stored — client-reported numbers are never trusted directly).

## Layering

- **`src/app/**`** — pages and API route handlers. Route handlers stay
  thin: validate input, call a service function, translate the result into
  an HTTP response via `src/lib/api-handler.ts`.
- **`src/server/**`** — domain logic, organized by area (`server/auth/`,
  `server/speech/`). No HTTP awareness — throws `AppError` on failure, unit
  testable without spinning up routes.
- **`src/lib/**`** — cross-cutting utilities, including `speech-metrics.ts`
  (the scoring math, isomorphic — safe to import client- or server-side).
- **`src/components/**`** — UI, organized by feature (`layout`,
  `marketing`, `auth`, `practice`, `reports`).
- **`src/hooks/**`**, **`src/services/**`**, **`src/stores/**`** — client
  data layer. `use-speech-session.ts` is the most involved hook: it owns
  the mic-permission → Deepgram-WebSocket → live-metrics state machine for
  an in-progress recording.

## Auth model

Unchanged from before the pivot — this part of the app is fully generic.
JWT access token (15 min, `jose`) + rotating opaque refresh token (30 days)
in httpOnly cookies. See `src/server/auth/**` and `src/lib/auth-server.ts`.
Middleware does a cheap cookie-presence check for UX; real enforcement is
`requireUser()` on every protected route/page.

## Scoring approach (why rule-based, not "AI magic")

Confidence, pace, and vocal-variety scores are computed from real, measured
signals — not a trained ML model (there's no labeled training data to train
one on, and pretending otherwise would make the scores unexplainable,
which the product explicitly should never do):

- **WPM**: word count ÷ elapsed minutes, from Deepgram word timestamps.
- **Filler words**: dictionary match against the transcript, with
  timestamps.
- **Pauses**: gaps between consecutive word timestamps, classified as
  natural / long / awkward by duration.
- **Pitch & volume variance**: sampled client-side via the Web Audio API's
  `AnalyserNode` (~every 150ms), tracked for coefficient of variation.
- **Confidence score**: a weighted composite of the above, with a
  generated explanation naming exactly which factors moved the score.

Claude (Anthropic API) is used specifically where an LLM is the right
tool: reading the transcript for structure, persuasiveness, vocabulary,
and generating the qualitative coaching report (strengths, weaknesses,
action plan, drills). It is never used to fabricate the acoustic/timing
scores above — those come from real measurements.

## Error handling contract

Unchanged: every API response is `{ data: T }` or
`{ error: { code, message } }`, via `withErrorHandling` in
`src/lib/api-handler.ts`.
