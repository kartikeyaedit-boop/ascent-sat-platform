import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { resetWithRecoveryCodeSchema } from "@/server/auth/validation";
import { resetPasswordWithRecoveryCode } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, recoveryCode, password } = resetWithRecoveryCodeSchema.parse(
    await request.json(),
  );
  const result = await resetPasswordWithRecoveryCode(email, recoveryCode, password);
  return apiSuccess(result);
});
