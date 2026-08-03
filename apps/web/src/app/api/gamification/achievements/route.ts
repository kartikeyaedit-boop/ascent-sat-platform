import { apiSuccess, withErrorHandling } from "@/lib/api-handler";
import { requireUser } from "@/lib/auth-server";
import { listAchievementsForUser } from "@/server/gamification/gamification.service";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const achievements = await listAchievementsForUser(user.id);
  return apiSuccess({ achievements });
});
