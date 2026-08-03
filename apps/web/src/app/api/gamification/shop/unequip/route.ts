import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { unequipItem } from "@/server/gamification/shop.service";

export const POST = withErrorHandling(async () => {
  const user = await requireUser();
  await unequipItem(user.id);
  return apiSuccess({ equippedTitle: null });
});
