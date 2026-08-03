import { requireUser } from "@/lib/auth-server";
import { listShopForUser } from "@/server/gamification/shop.service";
import { getGamificationSummary } from "@/server/gamification/gamification.service";
import { StoreGrid } from "@/components/store/store-grid";

export default async function StorePage() {
  const user = await requireUser();
  const [items, summary] = await Promise.all([
    listShopForUser(user.id),
    getGamificationSummary(user.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Store</h1>
        <p className="text-muted-foreground">
          Spend coins you&apos;ve earned from practicing on profile titles.
        </p>
      </div>

      <StoreGrid initialItems={items} initialCoins={summary.coins} />
    </div>
  );
}
