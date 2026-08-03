import { apiFetch } from "@/lib/api-client";

export interface GamificationSummary {
  xp: number;
  coins: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
  currentStreak: number;
  longestStreak: number;
  equippedTitle: string | null;
}

export interface AchievementListItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface ShopListItem {
  key: string;
  name: string;
  price: number;
  owned: boolean;
  equipped: boolean;
}

export function fetchGamificationSummary() {
  return apiFetch<GamificationSummary>("/api/gamification/summary");
}

export function fetchAchievements() {
  return apiFetch<{ achievements: AchievementListItem[] }>("/api/gamification/achievements");
}

export function fetchShop() {
  return apiFetch<{ items: ShopListItem[] }>("/api/gamification/shop");
}

export function purchaseShopItem(key: string) {
  return apiFetch<{ coins: number }>("/api/gamification/shop/purchase", {
    method: "POST",
    body: { key },
  });
}

export function equipShopItem(key: string) {
  return apiFetch<{ equippedTitle: string }>("/api/gamification/shop/equip", {
    method: "POST",
    body: { key },
  });
}

export function unequipShopItem() {
  return apiFetch<{ equippedTitle: null }>("/api/gamification/shop/unequip", {
    method: "POST",
  });
}
