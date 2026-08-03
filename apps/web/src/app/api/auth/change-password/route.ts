import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { changePasswordSchema } from "@/server/auth/validation";
import { changePassword } from "@/server/auth/auth.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser();
  const { currentPassword, newPassword } = changePasswordSchema.parse(await request.json());
  await changePassword(user.id, currentPassword, newPassword);
  return apiSuccess({ ok: true });
});
