import type { NextResponse } from "next/server";
import type { SessionTokens } from "./auth.service";
import { ACCESS_TOKEN_TTL_MS } from "./tokens";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./cookie-names";

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };

const isProduction = process.env.NODE_ENV === "production";

export function setSessionCookies(
  response: NextResponse,
  tokens: SessionTokens,
): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: tokens.refreshTokenExpiresAt,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}
