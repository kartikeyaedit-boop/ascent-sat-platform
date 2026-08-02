import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/server/auth/validation";
import { loginUser } from "@/server/auth/auth.service";
import { setSessionCookies } from "@/server/auth/cookies";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = checkRateLimit(
    `login:${getClientIp(request)}`,
    10,
    15 * 60 * 1000,
  );
  if (!allowed) {
    return apiError("RATE_LIMITED", "Too many attempts. Try again later.", 429);
  }

  const body = loginSchema.parse(await request.json());
  const { user, tokens } = await loginUser(body);

  const response = apiSuccess({ user }) as NextResponse;
  setSessionCookies(response, tokens);
  return response;
});
