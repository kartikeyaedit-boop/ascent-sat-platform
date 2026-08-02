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
| POST | `/api/speech/sessions` | `{ mode, promptText, transcript, durationSeconds, wordTimestamps, pitchSamples, volumeSamples }` | Server recomputes all scores authoritatively (never trusts client-computed numbers), stores the session, generates rule-based coaching feedback, returns the full report. No external API calls — see [architecture.md](./architecture.md) for why. |
| GET | `/api/speech/sessions/:id` | — | Fetch one report. 404 if it doesn't belong to the requesting user. |

`wordTimestamps` is `[{ word, startMs, endMs, confidence }]` — approximated
client-side from the browser's Speech Recognition API (see
[architecture.md](./architecture.md)). `pitchSamples`/`volumeSamples` are
`[{ atMs, value }]` from the client's `AnalyserNode` sampling (a real
measurement, not approximated).

## Planned (added per-phase)

- `/api/speech/sessions` (GET, list + pagination) — Phase 3, session history.
- `/api/gamification/*` — Phase 4.
- `/api/library/*` — Phase 5, speech library/techniques.
- `/api/exercises/*` — Phase 6.
- `/api/speech/generate` — Phase 7, AI speech generator (would require a paid LLM API — revisit budget at that point).
