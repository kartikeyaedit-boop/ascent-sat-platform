import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { regenerateRecoveryCode } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async () => {
  const user = await requireUser();
  const recoveryCode = await regenerateRecoveryCode(user.id);
  return apiSuccess({ recoveryCode });
});
