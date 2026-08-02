import { NextRequest } from "next/server";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-handler";
import { env } from "@/lib/env";
import { getLastEmail } from "@/server/auth/mailer";

/**
 * Test-only endpoint: returns the last email captured in memory for an
 * address (see mailer.ts). Lets E2E tests read verification/reset links
 * without a real inbox. Disabled unless ENABLE_TEST_ENDPOINTS=true is set
 * explicitly (never on by default, even in production builds used for
 * local E2E runs).
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!env.ENABLE_TEST_ENDPOINTS) {
    return apiError("NOT_FOUND", "Not found.", 404);
  }

  const to = request.nextUrl.searchParams.get("to");
  if (!to)
    return apiError("VALIDATION_ERROR", "Missing 'to' query param.", 422);

  const email = getLastEmail(to);
  if (!email)
    return apiError("NOT_FOUND", "No email captured for that address.", 404);

  return apiSuccess({ email });
});
