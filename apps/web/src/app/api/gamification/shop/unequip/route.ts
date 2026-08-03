import { NextRequest } from "next/server";
import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { shopCategorySchema } from "@/server/gamification/validation";
import { unequipItem } from "@/server/gamification/shop.service";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireUser();
  const { category } = shopCategorySchema.parse(await request.json());
  await unequipItem(user.id, category);
  return apiSuccess({ category });
});
