import { describe, it, expect } from "vitest";
import {
  calculateLevel,
  calculateSessionXp,
  calculateSessionCoins,
  calculateStreakBonusXp,
  updateStreak,
} from "./gamification";

describe("calculateLevel", () => {
  it("starts at level 1 with 0 xp", () => {
    const info = calculateLevel(0);
    expect(info.level).toBe(1);
    expect(info.xpIntoLevel).toBe(0);
    expect(info.xpForNextLevel).toBe(50);
    expect(info.progress).toBe(0);
  });

  it("advances to level 2 exactly at its threshold", () => {
    expect(calculateLevel(49).level).toBe(1);
    expect(calculateLevel(50).level).toBe(2);
  });

  it("advances to level 3 exactly at its threshold", () => {
    expect(calculateLevel(199).level).toBe(2);
    expect(calculateLevel(200).level).toBe(3);
  });

  it("computes progress into the current level", () => {
    // level 2 spans xp 50-200 (150 xp wide); 125 xp is 75 in, halfway.
    const info = calculateLevel(125);
    expect(info.level).toBe(2);
    expect(info.xpIntoLevel).toBe(75);
    expect(info.xpForNextLevel).toBe(150);
    expect(info.progress).toBeCloseTo(0.5);
  });

  it("clamps negative xp to level 1", () => {
    expect(calculateLevel(-100).level).toBe(1);
  });
});

describe("calculateSessionXp", () => {
  it("awards the base amount even for a 0 score", () => {
    expect(calculateSessionXp(0)).toBe(20);
  });

  it("awards the maximum bonus for a perfect score", () => {
    expect(calculateSessionXp(100)).toBe(50);
  });

  it("scales between base and max for a mid score", () => {
    const xp = calculateSessionXp(50);
    expect(xp).toBeGreaterThan(20);
    expect(xp).toBeLessThan(50);
  });
});

describe("calculateSessionCoins", () => {
  it("awards base coins for a 0 score and max for a perfect score", () => {
    expect(calculateSessionCoins(0)).toBe(40);
    expect(calculateSessionCoins(100)).toBe(120);
  });
});

describe("calculateStreakBonusXp", () => {
  it("gives no bonus for day 1", () => {
    expect(calculateStreakBonusXp(1)).toBe(0);
  });

  it("gives a growing bonus for early streak days, capped", () => {
    expect(calculateStreakBonusXp(2)).toBe(4);
    expect(calculateStreakBonusXp(5)).toBe(10);
    expect(calculateStreakBonusXp(20)).toBe(20);
  });

  it("gives a flat milestone bonus on 7-day multiples", () => {
    expect(calculateStreakBonusXp(7)).toBe(50);
    expect(calculateStreakBonusXp(14)).toBe(50);
  });
});

describe("updateStreak", () => {
  it("starts a streak of 1 on first-ever practice", () => {
    const result = updateStreak({
      lastPracticeDate: null,
      currentStreak: 0,
      longestStreak: 0,
      now: new Date("2026-08-03T10:00:00"),
    });
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.isNewStreakDay).toBe(true);
  });

  it("does not change the streak for a second session on the same day", () => {
    const result = updateStreak({
      lastPracticeDate: new Date("2026-08-03T09:00:00"),
      currentStreak: 3,
      longestStreak: 5,
      now: new Date("2026-08-03T20:00:00"),
    });
    expect(result.currentStreak).toBe(3);
    expect(result.streakBonusXp).toBe(0);
    expect(result.isNewStreakDay).toBe(false);
  });

  it("extends the streak on the very next calendar day", () => {
    const result = updateStreak({
      lastPracticeDate: new Date("2026-08-02T22:00:00"),
      currentStreak: 3,
      longestStreak: 5,
      now: new Date("2026-08-03T06:00:00"),
    });
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(5);
    expect(result.isNewStreakDay).toBe(true);
  });

  it("updates the longest streak when the current streak surpasses it", () => {
    const result = updateStreak({
      lastPracticeDate: new Date("2026-08-02T22:00:00"),
      currentStreak: 5,
      longestStreak: 5,
      now: new Date("2026-08-03T06:00:00"),
    });
    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(6);
  });

  it("resets the streak to 1 after skipping a day", () => {
    const result = updateStreak({
      lastPracticeDate: new Date("2026-08-01T09:00:00"),
      currentStreak: 10,
      longestStreak: 10,
      now: new Date("2026-08-03T09:00:00"),
    });
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(10);
    expect(result.isNewStreakDay).toBe(true);
  });
});
