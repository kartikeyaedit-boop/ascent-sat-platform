import { NextRequest } from "next/server";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/server/auth/validation";
import { requestPasswordReset } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = checkRateLimit(
    `forgot-password:${getClientIp(request)}`,
    3,
    15 * 60 * 1000,
  );
  if (!allowed) {
    return apiError("RATE_LIMITED", "Too many attempts. Try again later.", 429);
  }

  const body = forgotPasswordSchema.parse(await request.json());
  await requestPasswordReset(body.email);
  // Always succeed, regardless of whether the account exists.
  return apiSuccess({ success: true });
});
