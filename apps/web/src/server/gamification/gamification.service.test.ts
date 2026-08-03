import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    speechSession: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
    userAchievement: { findMany: vi.fn(), createMany: vi.fn() },
    xPLog: { createMany: vi.fn() },
    achievement: { upsert: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { listAchievementsForUser } from "./gamification.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

function session(overrides: Partial<{
  overallScore: number;
  paceScore: number;
  vocalVarietyScore: number;
  clarityScore: number;
  confidenceScore: number;
  fillerWords: unknown;
  durationSeconds: number;
}> = {}) {
  return {
    overallScore: 50,
    paceScore: 50,
    vocalVarietyScore: 50,
    clarityScore: 50,
    confidenceScore: 50,
    fillerWords: [],
    durationSeconds: 60,
    ...overrides,
  };
}

// In-memory stand-in for the achievement/user_achievement tables so the
// backfill's "unlock, then re-read what's unlocked" round trip behaves like
// a real database instead of a static mock value.
let achievementKeyById: Record<string, string>;
let unlockedRows: { achievementId: string }[];

beforeEach(() => {
  vi.clearAllMocks();
  achievementKeyById = {};
  unlockedRows = [];

  mockedPrisma.user.findUniqueOrThrow.mockResolvedValue({ longestStreak: 0 } as never);
  mockedPrisma.user.update.mockResolvedValue({} as never);
  mockedPrisma.xPLog.createMany.mockResolvedValue({} as never);

  mockedPrisma.achievement.upsert.mockImplementation((({ where }: { where: { key: string } }) => {
    const id = `achievement_${where.key}`;
    achievementKeyById[id] = where.key;
    return Promise.resolve({ id, key: where.key });
  }) as never);

  mockedPrisma.userAchievement.findMany.mockImplementation((() =>
    Promise.resolve(
      unlockedRows.map((r) => ({ achievement: { key: achievementKeyById[r.achievementId] } })),
    )) as never);

  mockedPrisma.userAchievement.createMany.mockImplementation(((args: {
    data: { achievementId: string }[];
  }) => {
    unlockedRows.push(...args.data);
    return Promise.resolve({ count: args.data.length });
  }) as never);
});

describe("listAchievementsForUser (backfill)", () => {
  it("retroactively unlocks first_session for an account with one pre-existing session", async () => {
    mockedPrisma.speechSession.findMany.mockResolvedValue([session()] as never);

    const result = await listAchievementsForUser("user_1");

    expect(result.find((a) => a.key === "first_session")?.unlocked).toBe(true);
    expect(mockedPrisma.user.update).toHaveBeenCalledOnce();
  });

  it("does not unlock personal_best on the very first historical session", async () => {
    mockedPrisma.speechSession.findMany.mockResolvedValue([session({ overallScore: 80 })] as never);

    const result = await listAchievementsForUser("user_1");

    expect(result.find((a) => a.key === "personal_best")?.unlocked).toBe(false);
  });

  it("unlocks personal_best when a later historical session beats an earlier one", async () => {
    mockedPrisma.speechSession.findMany.mockResolvedValue([
      session({ overallScore: 40 }),
      session({ overallScore: 80 }),
    ] as never);

    const result = await listAchievementsForUser("user_1");

    expect(result.find((a) => a.key === "personal_best")?.unlocked).toBe(true);
  });

  it("does nothing when the account has no sessions at all", async () => {
    mockedPrisma.speechSession.findMany.mockResolvedValue([] as never);

    await listAchievementsForUser("user_1");

    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    expect(mockedPrisma.userAchievement.createMany).not.toHaveBeenCalled();
  });

  it("does not re-unlock (or re-award) an achievement that's already unlocked", async () => {
    achievementKeyById["achievement_first_session"] = "first_session";
    unlockedRows.push({ achievementId: "achievement_first_session" });

    mockedPrisma.speechSession.findMany.mockResolvedValue([session()] as never);

    await listAchievementsForUser("user_1");

    // Only the newly-unlocked achievements (not first_session again) should
    // have been passed to createMany.
    const created = mockedPrisma.userAchievement.createMany.mock.calls[0]?.[0]?.data as
      | { achievementId: string }[]
      | undefined;
    expect(created?.some((u) => u.achievementId === "achievement_first_session")).toBe(false);
  });
});
