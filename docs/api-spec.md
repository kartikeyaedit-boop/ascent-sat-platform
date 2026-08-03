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
| POST | `/api/speech/sessions` | `{ mode, promptText, transcript, durationSeconds, wordTimestamps, pitchSamples, volumeSamples, claritySamples }` | Server recomputes all scores authoritatively (never trusts client-computed numbers), stores the session, generates rule-based coaching feedback, awards gamification rewards (XP/coins/streak/achievements — non-fatal if it fails), returns `{ session, feedback, rewards }`. No external API calls — see [architecture.md](./architecture.md) for why. |
| GET | `/api/speech/sessions` | — | Paginated session history for the requesting user (`?page=`). |
| GET | `/api/speech/sessions/:id` | — | Fetch one report. 404 if it doesn't belong to the requesting user. |

`wordTimestamps` is `[{ word, startMs, endMs, confidence }]` — approximated
client-side from the browser's Speech Recognition API (see
[architecture.md](./architecture.md)). `pitchSamples`/`volumeSamples`/
`claritySamples` are `[{ atMs, value }]` from the client's `AnalyserNode`
sampling (a real measurement, not approximated).

## Gamification (Phase 4)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/gamification/summary` | — | XP, derived level, coins, streak, equipped title — for the topnav/dashboard. |
| GET | `/api/gamification/achievements` | — | Full 16-achievement catalog merged with this user's unlock status. |
| GET | `/api/gamification/shop` | — | Full shop catalog merged with this user's owned/equipped status. |
| POST | `/api/gamification/shop/purchase` | `{ key }` | Buys an item with coins. 409 if already owned, 402 if insufficient coins. |
| POST | `/api/gamification/shop/equip` | `{ key }` | Equips an owned item as the profile title. 403 if not owned. |
| POST | `/api/gamification/shop/unequip` | — | Clears the equipped title. |

XP/coins/streak are never awarded directly via API — they're a side effect
of `POST /api/speech/sessions` (see `src/server/gamification/gamification.service.ts`).

## Planned (added per-phase)

- `/api/library/*` — Phase 5, speech library/techniques.
- `/api/exercises/*` — Phase 6.
- `/api/speech/generate` — Phase 7, AI speech generator (would require a paid LLM API — revisit budget at that point).
