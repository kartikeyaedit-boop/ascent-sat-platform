import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { listShopForUser } from "@/server/gamification/shop.service";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const items = await listShopForUser(user.id);
  return apiSuccess({ items });
});
