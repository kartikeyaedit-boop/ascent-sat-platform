import type { ShopItemRarity } from "@/services/gamification";

export const RARITY_LABEL: Record<ShopItemRarity, string> = {
  COMMON: "Common",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};

/** Border/glow + badge styling per rarity tier, light and dark aware. */
export const RARITY_STYLES: Record<ShopItemRarity, { border: string; badge: string; glow: string; tile: string }> = {
  COMMON: {
    border: "border-border",
    badge: "bg-muted text-muted-foreground",
    glow: "",
    tile: "bg-muted",
  },
  RARE: {
    border: "border-blue-400/60 dark:border-blue-500/50",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    glow: "shadow-[0_0_0_1px_rgba(59,130,246,0.15)]",
    tile: "bg-blue-500/10",
  },
  EPIC: {
    border: "border-purple-400/60 dark:border-purple-500/50",
    badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.25)]",
    tile: "bg-purple-500/10",
  },
  LEGENDARY: {
    border: "border-amber-400/70 dark:border-amber-500/60",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    glow: "shadow-[0_0_16px_rgba(245,158,11,0.35)]",
    tile: "bg-amber-500/10",
  },
};
