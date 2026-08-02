import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  return apiSuccess({ user });
});
