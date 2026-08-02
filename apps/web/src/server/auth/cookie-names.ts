/**
 * Cookie name constants only — zero dependencies. Kept separate from
 * cookies.ts so Edge-runtime code (middleware.ts) can import just the names
 * without pulling in Node-only modules (tokens.ts uses Node's `crypto`).
 */
export const ACCESS_TOKEN_COOKIE = "sat_access_token";
export const REFRESH_TOKEN_COOKIE = "sat_refresh_token";
