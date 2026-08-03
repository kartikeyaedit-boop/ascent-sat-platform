import { prisma } from "@/lib/prisma";
import { AuthErrors } from "@/lib/errors";

/** How recent a session must be to count a user as "active". */
const ACTIVE_WINDOW_DAYS = 7;

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUserRows] = await Promise.all([
    prisma.user.count(),
    prisma.speechSession.findMany({
      where: { createdAt: { gte: since } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  return { totalUsers, activeUsers: activeUserRows.length };
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
  lastSessionAt: Date | null;
  createdAt: Date;
}

export async function listAllUsersWithStats(): Promise<AdminUserListItem[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      xp: true,
      coins: true,
      currentStreak: true,
      createdAt: true,
      _count: { select: { speechSessions: true } },
      speechSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.emailVerified,
    xp: u.xp,
    coins: u.coins,
    currentStreak: u.currentStreak,
    totalSessions: u._count.speechSessions,
    lastSessionAt: u.speechSessions[0]?.createdAt ?? null,
    createdAt: u.createdAt,
  }));
}

/** Positive delta gives coins, negative takes them. Clamped at 0 — an admin
 * "take" can never drive a user's balance negative. */
export async function adjustUserCoins(
  userId: string,
  delta: number,
): Promise<{ coins: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
  if (!user) throw AuthErrors.notFound();

  const coins = Math.max(0, user.coins + delta);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coins },
    select: { coins: true },
  });
  return updated;
}
