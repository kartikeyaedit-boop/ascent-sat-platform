"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as gamificationService from "@/services/gamification";
import type { GamificationSummary, ShopListItem } from "@/services/gamification";

const SUMMARY_QUERY_KEY = ["gamification", "summary"] as const;
const ACHIEVEMENTS_QUERY_KEY = ["gamification", "achievements"] as const;
const SHOP_QUERY_KEY = ["gamification", "shop"] as const;

export function useGamificationSummary(initialData?: GamificationSummary) {
  return useQuery({
    queryKey: SUMMARY_QUERY_KEY,
    queryFn: gamificationService.fetchGamificationSummary,
    initialData,
    staleTime: 30 * 1000,
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ACHIEVEMENTS_QUERY_KEY,
    queryFn: gamificationService.fetchAchievements,
  });
}

export function useShop(initialData?: ShopListItem[]) {
  return useQuery({
    queryKey: SHOP_QUERY_KEY,
    queryFn: async () => (await gamificationService.fetchShop()).items,
    initialData,
  });
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationService.purchaseShopItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
    },
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationService.equipShopItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
    },
  });
}

export function useUnequipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationService.unequipShopItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOP_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
    },
  });
}
