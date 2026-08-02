import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { resetPasswordSchema } from "@/server/auth/validation";
import { resetPassword } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = resetPasswordSchema.parse(await request.json());
  await resetPassword(body.token, body.password);
  return apiSuccess({ success: true });
});
