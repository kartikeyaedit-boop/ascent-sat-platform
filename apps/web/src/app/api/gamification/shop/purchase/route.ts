import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { shopItemKeySchema } from "@/server/gamification/validation";
import { purchaseItem } from "@/server/gamification/shop.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser();
  const { key } = shopItemKeySchema.parse(await request.json());
  const result = await purchaseItem(user.id, key);
  return apiSuccess(result);
});
