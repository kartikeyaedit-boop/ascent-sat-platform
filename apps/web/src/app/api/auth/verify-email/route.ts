import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { verifyEmailSchema } from "@/server/auth/validation";
import { verifyEmail } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = verifyEmailSchema.parse(await request.json());
  await verifyEmail(body.token);
  return apiSuccess({ success: true });
});
