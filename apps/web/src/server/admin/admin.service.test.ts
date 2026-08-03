import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    speechSession: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getAdminStats, listAllUsersWithStats, adjustUserCoins } from "./admin.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAdminStats", () => {
  it("counts total users and users active within the last 7 days", async () => {
    mockedPrisma.user.count.mockResolvedValue(42 as never);
    mockedPrisma.speechSession.findMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ] as never);

    const stats = await getAdminStats();

    expect(stats.totalUsers).toBe(42);
    expect(stats.activeUsers).toBe(2);
  });
});

describe("listAllUsersWithStats", () => {
  it("maps session count and most recent session into each user row", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "u1",
        email: "a@example.com",
        name: "A",
        role: "STUDENT",
        emailVerified: true,
        xp: 100,
        coins: 20,
        currentStreak: 3,
        createdAt: new Date("2026-01-01"),
        _count: { speechSessions: 5 },
        speechSessions: [{ createdAt: new Date("2026-01-05") }],
      },
      {
        id: "u2",
        email: "b@example.com",
        name: "B",
        role: "STUDENT",
        emailVerified: false,
        xp: 0,
        coins: 0,
        currentStreak: 0,
        createdAt: new Date("2026-01-02"),
        _count: { speechSessions: 0 },
        speechSessions: [],
      },
    ] as never);

    const result = await listAllUsersWithStats();

    expect(result[0].totalSessions).toBe(5);
    expect(result[0].lastSessionAt).toEqual(new Date("2026-01-05"));
    expect(result[1].totalSessions).toBe(0);
    expect(result[1].lastSessionAt).toBeNull();
  });
});

describe("adjustUserCoins", () => {
  it("increments coins by a positive delta", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ coins: 50 } as never);
    mockedPrisma.user.update.mockResolvedValue({ coins: 75 } as never);

    const result = await adjustUserCoins("u1", 25);

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { coins: 75 } }),
    );
    expect(result.coins).toBe(75);
  });

  it("clamps at 0 rather than going negative when taking more than the balance", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ coins: 10 } as never);
    mockedPrisma.user.update.mockResolvedValue({ coins: 0 } as never);

    await adjustUserCoins("u1", -100);

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { coins: 0 } }),
    );
  });

  it("throws NOT_FOUND for a nonexistent user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(adjustUserCoins("nope", 10)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
