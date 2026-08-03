import { apiFetch } from "@/lib/api-client";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "ADMIN";
  emailVerified: boolean;
  xp: number;
  coins: number;
  currentStreak: number;
  totalSessions: number;
  lastSessionAt: string | null;
  createdAt: string;
}

export function fetchAdminStats() {
  return apiFetch<AdminStats>("/api/admin/stats");
}

export function fetchAdminUsers() {
  return apiFetch<{ users: AdminUserListItem[] }>("/api/admin/users");
}

export function adjustUserCoins(userId: string, delta: number) {
  return apiFetch<{ coins: number }>(`/api/admin/users/${userId}/coins`, {
    method: "POST",
    body: { delta },
  });
}
