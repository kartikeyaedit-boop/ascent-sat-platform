import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { AuthErrors } from "@/lib/errors";
import { refreshSession } from "@/server/auth/auth.service";
import { REFRESH_TOKEN_COOKIE, setSessionCookies } from "@/server/auth/cookies";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) throw AuthErrors.unauthenticated();

  const { user, tokens } = await refreshSession(refreshToken);

  const response = apiSuccess({ user }) as NextResponse;
  setSessionCookies(response, tokens);
  return response;
});
