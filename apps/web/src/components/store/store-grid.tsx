"use client";

import { toast } from "sonner";
import { Check, Coins, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useShop,
  useGamificationSummary,
  usePurchaseItem,
  useEquipItem,
  useUnequipItem,
} from "@/hooks/use-gamification";
import { ApiClientError } from "@/types/api";
import type { ShopListItem } from "@/services/gamification";
import { cn } from "@/lib/utils";

export function StoreGrid({
  initialItems,
  initialCoins,
}: {
  initialItems: ShopListItem[];
  initialCoins: number;
}) {
  const { data: items } = useShop(initialItems);
  const { data: summary } = useGamificationSummary();
  const coins = summary?.coins ?? initialCoins;
  const purchase = usePurchaseItem();
  const equip = useEquipItem();
  const unequip = useUnequipItem();

  const pendingKey = purchase.isPending
    ? purchase.variables
    : equip.isPending
      ? equip.variables
      : undefined;

  function handlePurchase(item: ShopListItem) {
    purchase.mutate(item.key, {
      onSuccess: () => toast.success(`Purchased "${item.name}".`),
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Purchase failed.");
      },
    });
  }

  function handleEquip(item: ShopListItem) {
    equip.mutate(item.key, {
      onSuccess: () => toast.success(`Equipped "${item.name}".`),
      onError: (err) => {
        toast.error(err instanceof ApiClientError ? err.message : "Couldn't equip that.");
      },
    });
  }

  function handleUnequip() {
    unequip.mutate(undefined, {
      onSuccess: () => toast.success("Title unequipped."),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-600">
          <Coins className="size-4" />
          {coins} coins
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(items ?? initialItems).map((item) => {
          const isPending = pendingKey === item.key || (item.equipped && unequip.isPending);
          return (
            <Card key={item.key} className={cn(item.equipped && "border-primary")}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Tag className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {item.equipped && <Check className="size-4 shrink-0 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.price} coins</p>
                </div>
                {item.owned ? (
                  item.equipped ? (
                    <Button size="sm" variant="outline" disabled={isPending} onClick={handleUnequip}>
                      Unequip
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleEquip(item)}>
                      Equip
                    </Button>
                  )
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending || coins < item.price}
                    onClick={() => handlePurchase(item)}
                  >
                    Buy
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
