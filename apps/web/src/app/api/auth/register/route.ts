import { NextRequest } from "next/server";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { registerSchema } from "@/server/auth/validation";
import { registerUser } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = checkRateLimit(
    `register:${getClientIp(request)}`,
    5,
    15 * 60 * 1000,
  );
  if (!allowed) {
    return apiError("RATE_LIMITED", "Too many attempts. Try again later.", 429);
  }

  const body = registerSchema.parse(await request.json());
  const { user, recoveryCode } = await registerUser(body);
  return apiSuccess({ user, recoveryCode }, 201);
});
