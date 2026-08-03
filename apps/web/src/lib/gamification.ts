/**
 * Gamification math — pure functions, no I/O, same pattern as
 * speech-metrics.ts. Level, streak, and reward calculations all live here
 * so they're one auditable source of truth and trivially unit-testable.
 *
 * Level is always *derived* from total XP (never stored directly) so it
 * can never drift out of sync — see calculateLevel. XP/coin awards are
 * still logged per-event in the XPLog table for an auditable history, but
 * the user's running xp/coins totals are the source of truth for balance.
 */

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0-1, how far into the current level
}

export interface StreakUpdateResult {
  currentStreak: number;
  longestStreak: number;
  streakBonusXp: number;
  /** False when this is a second (or later) session on the same calendar
   * day — the streak doesn't change and no bonus is awarded again. */
  isNewStreakDay: boolean;
}

/**
 * Cumulative XP required to *reach* a given level. Quadratic curve (each
 * level costs more than the last, matching typical game-progression
 * feel) — level 1 is free, level 2 at 50 XP, level 3 at 200 XP, level 4
 * at 450 XP, etc.
 */
function thresholdForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}

export function calculateLevel(xp: number): LevelInfo {
  const safeXp = Math.max(0, xp);

  let level = Math.max(1, Math.floor(Math.sqrt(safeXp / 50)) + 1);
  // Floating-point sqrt can land one level off right at a threshold boundary — correct for it.
  while (thresholdForLevel(level + 1) <= safeXp) level++;
  while (level > 1 && thresholdForLevel(level) > safeXp) level--;

  const currentThreshold = thresholdForLevel(level);
  const nextThreshold = thresholdForLevel(level + 1);
  const xpIntoLevel = safeXp - currentThreshold;
  const xpForNextLevel = nextThreshold - currentThreshold;

  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 1,
  };
}

/**
 * XP for completing a session: a flat base (practicing at all has value
 * regardless of how it went) plus a bonus scaled with the overall score,
 * so better sessions are worth more without punishing showing up.
 */
export function calculateSessionXp(overallScore: number): number {
  const base = 20;
  const bonus = Math.round((Math.max(0, Math.min(100, overallScore)) / 100) * 30);
  return base + bonus;
}

/**
 * Coins for completing a session: 40-120 depending on score (avg ~80 for a
 * decent session). Calibrated against the store's price curve (see
 * shop-items.ts) so a daily practicer clears the common tier in days, rare
 * in a couple of weeks, epic in a month or two, and the legendary tier
 * (10k-15k coins) in roughly 100-200 sessions — a real grind, but months,
 * not years.
 */
export function calculateSessionCoins(overallScore: number): number {
  const base = 40;
  const bonus = Math.round((Math.max(0, Math.min(100, overallScore)) / 100) * 80);
  return base + bonus;
}

/** Small growing daily bonus that resets each week, plus a flat milestone
 * bonus every 7th consecutive day. Capped so it never dwarfs session XP. */
export function calculateStreakBonusXp(streak: number): number {
  if (streak <= 1) return 0;
  if (streak % 7 === 0) return 50;
  return Math.min(20, streak * 2);
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Given the user's current streak state and a new practice event "now",
 * returns the updated streak. Practicing again on the same calendar day
 * is a no-op (streak already counted for today); practicing on the very
 * next calendar day extends it; any bigger gap resets it to 1.
 */
export function updateStreak(input: {
  lastPracticeDate: Date | null;
  currentStreak: number;
  longestStreak: number;
  now: Date;
}): StreakUpdateResult {
  const today = startOfDay(input.now);
  const last = input.lastPracticeDate ? startOfDay(input.lastPracticeDate) : null;

  if (last === today) {
    return {
      currentStreak: input.currentStreak,
      longestStreak: input.longestStreak,
      streakBonusXp: 0,
      isNewStreakDay: false,
    };
  }

  const isConsecutive = last !== null && today - last === ONE_DAY_MS;
  const currentStreak = isConsecutive ? input.currentStreak + 1 : 1;
  const longestStreak = Math.max(input.longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    streakBonusXp: calculateStreakBonusXp(currentStreak),
    isNewStreakDay: true,
  };
}
