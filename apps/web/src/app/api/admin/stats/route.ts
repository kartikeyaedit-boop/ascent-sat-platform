import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/auth-server";
import { getAdminStats } from "@/server/admin/admin.service";

export const GET = withErrorHandling(async () => {
  await requireAdmin();
  const stats = await getAdminStats();
  return apiSuccess(stats);
});
