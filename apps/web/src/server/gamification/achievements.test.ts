import { describe, it, expect } from "vitest";
import { checkNewlyUnlockedAchievements, type AchievementContext } from "./achievements";

function ctx(overrides: Partial<AchievementContext["stats"]> = {}): AchievementContext {
  return {
    session: {
      overallScore: 50,
      wpm: 140,
      fillerWordCount: 2,
      durationSeconds: 60,
      confidenceScore: 50,
      clarityScore: 50,
      paceScore: 50,
      vocalVarietyScore: 50,
    },
    stats: {
      totalSessions: 1,
      bestOverallScore: 50,
      currentStreak: 1,
      longestStreak: 1,
      ...overrides,
    },
  };
}

describe("checkNewlyUnlockedAchievements", () => {
  it("unlocks first_session on an account's very first session", () => {
    const unlocked = checkNewlyUnlockedAchievements(ctx({ totalSessions: 1 }), new Set());
    expect(unlocked.map((a) => a.key)).toContain("first_session");
  });

  it("still unlocks first_session retroactively when the count skipped past 1 (pre-existing sessions)", () => {
    // An account that already had sessions before achievements existed will
    // never see totalSessions land on exactly 1 again — >= must still catch it.
    const unlocked = checkNewlyUnlockedAchievements(ctx({ totalSessions: 4 }), new Set());
    expect(unlocked.map((a) => a.key)).toContain("first_session");
  });

  it("unlocks five_sessions once the count reaches or passes 5, even skipping past it", () => {
    const unlocked = checkNewlyUnlockedAchievements(
      ctx({ totalSessions: 7 }),
      new Set(["first_session"]),
    );
    expect(unlocked.map((a) => a.key)).toContain("five_sessions");
  });

  it("never re-returns an already-unlocked achievement", () => {
    const unlocked = checkNewlyUnlockedAchievements(
      ctx({ totalSessions: 1 }),
      new Set(["first_session"]),
    );
    expect(unlocked.map((a) => a.key)).not.toContain("first_session");
  });

  it("unlocks streak achievements once the streak reaches or passes the threshold", () => {
    const unlocked = checkNewlyUnlockedAchievements(
      ctx({ totalSessions: 10, currentStreak: 5 }),
      new Set(),
    );
    expect(unlocked.map((a) => a.key)).toContain("streak_3");
  });
});
