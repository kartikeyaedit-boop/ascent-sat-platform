import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { logoutUser } from "@/server/auth/auth.service";
import {
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
} from "@/server/auth/cookies";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  await logoutUser(refreshToken);

  const response = apiSuccess({ success: true }) as NextResponse;
  clearSessionCookies(response);
  return response;
});
