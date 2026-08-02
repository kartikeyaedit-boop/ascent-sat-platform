import { NextRequest } from "next/server";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { resendVerificationSchema } from "@/server/auth/validation";
import { resendVerificationEmail } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = checkRateLimit(
    `resend-verification:${getClientIp(request)}`,
    3,
    15 * 60 * 1000,
  );
  if (!allowed) {
    return apiError("RATE_LIMITED", "Too many attempts. Try again later.", 429);
  }

  const body = resendVerificationSchema.parse(await request.json());
  await resendVerificationEmail(body.email);
  // Always succeed, regardless of whether the account exists or is already verified.
  return apiSuccess({ success: true });
});
