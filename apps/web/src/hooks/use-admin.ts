"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminService from "@/services/admin";
import type { AdminStats, AdminUserListItem } from "@/services/admin";

const STATS_QUERY_KEY = ["admin", "stats"] as const;
const USERS_QUERY_KEY = ["admin", "users"] as const;

export function useAdminStats(initialData?: AdminStats) {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: adminService.fetchAdminStats,
    initialData,
  });
}

export function useAdminUsers(initialData?: AdminUserListItem[]) {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => (await adminService.fetchAdminUsers()).users,
    initialData,
  });
}

export function useAdjustCoins() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, delta }: { userId: string; delta: number }) =>
      adminService.adjustUserCoins(userId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
