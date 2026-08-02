# API Specification

Base path: `/api`. All responses are JSON, shaped as either `{ "data": T }`
or `{ "error": { "code": string, "message": string } }`.

Auth: httpOnly cookies (`sat_access_token`, `sat_refresh_token`), set by the
server on login/register/refresh. No `Authorization` header is used.

## Conventions

- Validation errors → `422` with `code: "VALIDATION_ERROR"`.
- Auth failures → `401` with `code: "UNAUTHENTICATED"`.
- Rate-limited routes → `429` with `code: "RATE_LIMITED"`.
- Unexpected errors → `500` with `code: "INTERNAL_ERROR"` (details are
  logged server-side, never leaked to the client).

## Phase 1 — Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, name }` | Creates an unverified user, emails a verification link. Rate-limited (5 / 15 min / IP). |
| POST | `/api/auth/login` | `{ email, password }` | Fails with `EMAIL_NOT_VERIFIED` if the account hasn't verified its email. Sets session cookies. Rate-limited (10 / 15 min / IP). |
| POST | `/api/auth/logout` | — | Revokes the current refresh token, clears cookies. |
| POST | `/api/auth/refresh` | — (reads refresh cookie) | Rotates the refresh token, reissues both cookies. |
| POST | `/api/auth/verify-email` | `{ token }` | Marks the account verified. Token is single-use, 24h expiry. |
| POST | `/api/auth/resend-verification` | `{ email }` | Always returns success (doesn't reveal account existence). Rate-limited (3 / 15 min / IP). |
| POST | `/api/auth/forgot-password` | `{ email }` | Always returns success. Rate-limited (3 / 15 min / IP). |
| POST | `/api/auth/reset-password` | `{ token, password }` | Single-use, 1h expiry. Revokes all existing sessions on success. |
| GET | `/api/me` | — | Returns the current user. `401` if not authenticated. |

### Dev/test-only

| Method | Path | Notes |
|---|---|---|
| GET | `/api/test/last-email?to=` | Returns the last email "sent" to an address (captured in memory when no SMTP is configured). Used by the Playwright E2E test to read verification links without a real inbox. Returns `404` unless `ENABLE_TEST_ENDPOINTS=true` is explicitly set — off by default everywhere, including production builds, unless a test run opts in. |

## Planned (added per-phase)

- `/api/gamification/*` — XP, coins, streaks, quests, achievements (Phase 2)
- `/api/questions/*`, `/api/practice/*` — content & practice sessions (Phase 3/4)
- `/api/tests/*` — full practice tests (Phase 5)
- `/api/analytics/*` — progress/analytics (Phase 6)
- `/api/shop/*` — cosmetic purchases (Phase 6)
- `/api/friends/*`, `/api/notifications/*` — social (Phase 7)
- `/api/admin/*` — admin panel (Phase 8)
- `/api/ai/*` — AI tutor, hints, study plans (Phase 9, Claude API)

Each group gets Zod-validated request/response shapes, pagination
(`?page&limit`) where it returns lists, and the same rate-limiting/error
conventions as Phase 1 when it's built.
