"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Coins } from "lucide-react";
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
import type { ShopListItem, ShopItemCategory } from "@/services/gamification";
import { RARITY_LABEL, RARITY_STYLES } from "./rarity";
import { cn } from "@/lib/utils";

const FILTERS: { label: string; value: ShopItemCategory | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Titles", value: "TITLE" },
  { label: "Pets", value: "PET" },
];

function ItemCard({
  item,
  coins,
  pendingKey,
  onBuy,
  onEquip,
  onUnequip,
  unequipPending,
}: {
  item: ShopListItem;
  coins: number;
  pendingKey: string | undefined;
  onBuy: (item: ShopListItem) => void;
  onEquip: (item: ShopListItem) => void;
  onUnequip: (item: ShopListItem) => void;
  unequipPending: boolean;
}) {
  const style = RARITY_STYLES[item.rarity];
  const isPending = pendingKey === item.key || (item.equipped && unequipPending);

  return (
    <Card
      className={cn(
        "overflow-hidden border-2 transition-all",
        style.border,
        item.equipped ? `ring-2 ring-primary ${style.glow}` : style.glow,
      )}
    >
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <div className={cn("flex size-20 items-center justify-center rounded-2xl text-5xl", style.tile)}>
          {item.emoji}
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <p className="font-semibold">{item.name}</p>
            {item.equipped && <Check className="size-4 shrink-0 text-emerald-500" />}
          </div>
          <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium", style.badge)}>
            {RARITY_LABEL[item.rarity]}
          </span>
        </div>

        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Coins className="size-3.5" />
          {item.price}
        </p>

        {item.owned ? (
          item.equipped ? (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => onUnequip(item)} className="w-full">
              Unequip
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={isPending} onClick={() => onEquip(item)} className="w-full">
              Equip
            </Button>
          )
        ) : (
          <Button size="sm" disabled={isPending || coins < item.price} onClick={() => onBuy(item)} className="w-full">
            Buy
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

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
  const [filter, setFilter] = useState<ShopItemCategory | "ALL">("ALL");

  const pendingKey = purchase.isPending
    ? purchase.variables
    : equip.isPending
      ? equip.variables
      : undefined;

  const allItems = items ?? initialItems;
  const visibleItems = filter === "ALL" ? allItems : allItems.filter((i) => i.category === filter);
  const equippedTitle = allItems.find((i) => i.category === "TITLE" && i.equipped);
  const equippedPet = allItems.find((i) => i.category === "PET" && i.equipped);

  function handlePurchase(item: ShopListItem) {
    purchase.mutate(item.key, {
      onSuccess: () => toast.success(`Purchased "${item.name}"!`),
      onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Purchase failed."),
    });
  }

  function handleEquip(item: ShopListItem) {
    equip.mutate(item.key, {
      onSuccess: () => toast.success(`Equipped "${item.name}".`),
      onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Couldn't equip that."),
    });
  }

  function handleUnequip(item: ShopListItem) {
    unequip.mutate(item.category, {
      onSuccess: () => toast.success(`Unequipped "${item.name}".`),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">Equipped:</span>
          <span className="flex items-center gap-1.5 rounded-full border px-3 py-1">
            {equippedTitle ? (
              <>
                <span>{equippedTitle.emoji}</span> {equippedTitle.name}
              </>
            ) : (
              <span className="text-muted-foreground">No title</span>
            )}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border px-3 py-1">
            {equippedPet ? (
              <>
                <span>{equippedPet.emoji}</span> {equippedPet.name}
              </>
            ) : (
              <span className="text-muted-foreground">No pet</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-600">
          <Coins className="size-4" />
          {coins} coins
        </div>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visibleItems.map((item) => (
          <ItemCard
            key={item.key}
            item={item}
            coins={coins}
            pendingKey={pendingKey}
            onBuy={handlePurchase}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            unequipPending={unequip.isPending}
          />
        ))}
      </div>
    </div>
  );
}
