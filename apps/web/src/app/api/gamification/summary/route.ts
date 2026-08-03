import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { getGamificationSummary } from "@/server/gamification/gamification.service";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const summary = await getGamificationSummary(user.id);
  return apiSuccess(summary);
});
