import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/auth-server";
import { listAllUsersWithStats } from "@/server/admin/admin.service";

export const GET = withErrorHandling(async () => {
  await requireAdmin();
  const users = await listAllUsersWithStats();
  return apiSuccess({ users });
});
