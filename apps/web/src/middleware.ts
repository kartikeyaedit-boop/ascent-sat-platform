import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE } from "@/server/auth/cookie-names";

/**
 * Cheap, edge-safe gate: redirects to /login if there's no session cookie at
 * all, so unauthenticated users never see a flash of the authenticated
 * shell. This does NOT verify the token (that requires Prisma/Node APIs
 * unavailable on the edge runtime) — real authorization is enforced by
 * `requireUser()` in every protected server component and API route.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
