# API Specification

Base path: `/api`. All responses are `{ "data": T }` or
`{ "error": { "code": string, "message": string } }`. Auth via httpOnly
cookies, no `Authorization` header.

## Auth (unchanged from before the pivot)

`/api/auth/{register,login,logout,refresh,verify-email,resend-verification,forgot-password,reset-password}`
and `/api/me` — fully generic, see [architecture.md](./architecture.md).
`/api/test/last-email` remains for E2E testing, gated behind
`ENABLE_TEST_ENDPOINTS=true`.

## Speech (Phase 1)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/speech/token` | — | Mints a short-lived, scoped Deepgram token server-side. The browser uses this to open a WebSocket directly to Deepgram — our server is never in the audio path. Auth required. |
| POST | `/api/speech/sessions` | `{ mode, promptText, transcript, durationSeconds, wordTimestamps, pitchSamples, volumeSamples }` | Server recomputes all scores authoritatively (never trusts client-computed numbers), stores the session, calls Claude for coaching feedback, returns the full report. |
| GET | `/api/speech/sessions/:id` | — | Fetch one report. 404 if it doesn't belong to the requesting user. |

`wordTimestamps` is `[{ word, startMs, endMs, confidence }]` (from Deepgram).
`pitchSamples`/`volumeSamples` are `[{ atMs, value }]` from the client's
`AnalyserNode` sampling.

## Planned (added per-phase)

- `/api/speech/sessions` (GET, list + pagination) — Phase 3, session history.
- `/api/gamification/*` — Phase 4.
- `/api/library/*` — Phase 5, speech library/techniques.
- `/api/exercises/*` — Phase 6.
- `/api/speech/generate` — Phase 7, AI speech generator via Claude.
