import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth-server";
import { listAchievementsForUser } from "@/server/gamification/gamification.service";
import { getIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
  const user = await requireUser();
  const achievements = await listAchievementsForUser(user.id);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">
          {unlockedCount} of {achievements.length} unlocked.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {achievements.map((a) => {
          const Icon = getIcon(a.icon);
          return (
            <Card
              key={a.key}
              className={cn(!a.unlocked && "opacity-60 grayscale")}
            >
              <CardContent className="flex items-start gap-3 py-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    a.unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.name}</p>
                    {a.unlocked && (
                      <Check className="size-4 shrink-0 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.unlocked
                      ? `Unlocked ${new Date(a.unlockedAt!).toLocaleDateString()}`
                      : `+${a.xpReward} XP · +${a.coinReward} coins`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
