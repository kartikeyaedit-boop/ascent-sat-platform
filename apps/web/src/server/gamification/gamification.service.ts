import { prisma } from "@/lib/prisma";
import {
  calculateLevel,
  calculateSessionXp,
  calculateSessionCoins,
  updateStreak,
} from "@/lib/gamification";
import { ACHIEVEMENTS, checkNewlyUnlockedAchievements, type AchievementContext } from "./achievements";

export interface UnlockedAchievementResult {
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
}

export interface SessionRewardsResult {
  xpAwarded: number;
  coinsAwarded: number;
  streakBonusXp: number;
  currentStreak: number;
  longestStreak: number;
  isNewStreakDay: boolean;
  unlockedAchievements: UnlockedAchievementResult[];
  totalXp: number;
  totalCoins: number;
}

export interface AwardSessionRewardsInput {
  userId: string;
  sessionId: string;
  overallScore: number;
  wpm: number;
  fillerWordCount: number;
  durationSeconds: number;
  confidenceScore: number;
  clarityScore: number;
  paceScore: number;
  vocalVarietyScore: number;
}

/**
 * Awards XP/coins for a completed session, updates the practice streak,
 * and unlocks any newly-earned achievements. Called from
 * session.service.ts right after the session row is created — like
 * coaching feedback generation, callers should treat failures here as
 * non-fatal to session creation (see the try/catch at the call site).
 */
export async function awardSessionRewards(
  input: AwardSessionRewardsInput,
): Promise<SessionRewardsResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: input.userId },
    select: { currentStreak: true, longestStreak: true, lastPracticeDate: true },
  });

  const now = new Date();
  const streak = updateStreak({
    lastPracticeDate: user.lastPracticeDate,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    now,
  });

  const sessionXp = calculateSessionXp(input.overallScore);
  const sessionCoins = calculateSessionCoins(input.overallScore);

  const [totalSessions, bestScoreAgg, existingUnlocks] = await Promise.all([
    prisma.speechSession.count({ where: { userId: input.userId } }),
    prisma.speechSession.aggregate({
      where: { userId: input.userId },
      _max: { overallScore: true },
    }),
    prisma.userAchievement.findMany({
      where: { userId: input.userId },
      select: { achievement: { select: { key: true } } },
    }),
  ]);

  const alreadyUnlockedKeys = new Set(existingUnlocks.map((u) => u.achievement.key));
  const bestOverallScore = Math.max(bestScoreAgg._max.overallScore ?? 0, input.overallScore);

  const ctx: AchievementContext = {
    session: {
      overallScore: input.overallScore,
      wpm: input.wpm,
      fillerWordCount: input.fillerWordCount,
      durationSeconds: input.durationSeconds,
      confidenceScore: input.confidenceScore,
      clarityScore: input.clarityScore,
      paceScore: input.paceScore,
      vocalVarietyScore: input.vocalVarietyScore,
    },
    stats: {
      totalSessions,
      bestOverallScore,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    },
  };

  const newlyUnlocked = checkNewlyUnlockedAchievements(ctx, alreadyUnlockedKeys);
  const achievementXp = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);
  const achievementCoins = newlyUnlocked.reduce((sum, a) => sum + a.coinReward, 0);

  const xpAwarded = sessionXp + streak.streakBonusXp + achievementXp;
  const coinsAwarded = sessionCoins + achievementCoins;

  const updatedUser = await prisma.user.update({
    where: { id: input.userId },
    data: {
      xp: { increment: xpAwarded },
      coins: { increment: coinsAwarded },
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastPracticeDate: now,
    },
    select: { xp: true, coins: true },
  });

  await prisma.xPLog.createMany({
    data: [
      { userId: input.userId, amount: sessionXp, reason: "session_complete", sessionId: input.sessionId },
      ...(streak.streakBonusXp > 0
        ? [{ userId: input.userId, amount: streak.streakBonusXp, reason: "streak_bonus", sessionId: input.sessionId }]
        : []),
      ...newlyUnlocked.map((a) => ({
        userId: input.userId,
        amount: a.xpReward,
        reason: `achievement:${a.key}`,
        sessionId: input.sessionId,
      })),
    ],
  });

  if (newlyUnlocked.length > 0) {
    // Achievement DB rows are lazily upserted on first unlock so the
    // static ACHIEVEMENTS catalog is always the source of truth, even if
    // a fresh key was added to code but never seeded into this database.
    const achievementRows = await Promise.all(
      newlyUnlocked.map((a) =>
        prisma.achievement.upsert({
          where: { key: a.key },
          update: {},
          create: {
            key: a.key,
            name: a.name,
            description: a.description,
            icon: a.icon,
            xpReward: a.xpReward,
            coinReward: a.coinReward,
          },
        }),
      ),
    );
    await prisma.userAchievement.createMany({
      data: achievementRows.map((row) => ({ userId: input.userId, achievementId: row.id })),
      skipDuplicates: true,
    });
  }

  return {
    xpAwarded,
    coinsAwarded,
    streakBonusXp: streak.streakBonusXp,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    isNewStreakDay: streak.isNewStreakDay,
    unlockedAchievements: newlyUnlocked.map((a) => ({
      key: a.key,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpReward: a.xpReward,
      coinReward: a.coinReward,
    })),
    totalXp: updatedUser.xp,
    totalCoins: updatedUser.coins,
  };
}

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

/** Lightweight summary for the topnav/dashboard — no session-specific data. */
export async function getGamificationSummary(userId: string): Promise<GamificationSummary> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      xp: true,
      coins: true,
      currentStreak: true,
      longestStreak: true,
      equippedTitle: { select: { name: true } },
    },
  });

  const levelInfo = calculateLevel(user.xp);

  return {
    xp: user.xp,
    coins: user.coins,
    level: levelInfo.level,
    xpIntoLevel: levelInfo.xpIntoLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    progress: levelInfo.progress,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    equippedTitle: user.equippedTitle?.name ?? null,
  };
}

export interface AchievementListItem {
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  unlocked: boolean;
  unlockedAt: Date | null;
}

/**
 * Catches an account up on achievements it already qualifies for but never
 * got credit for — e.g. sessions completed before an achievement existed,
 * or before the milestone-check bug fix (===  vs >=, see achievements.ts).
 * Replays the account's actual session history through the same check()
 * functions used for live awarding, so there's no separate "backfill rules"
 * to maintain. Run on-demand (achievements page load) rather than on every
 * request — it's a full history scan, not a cheap lookup.
 */
async function backfillAchievements(userId: string): Promise<void> {
  const [existingUnlocks, user, sessions] = await Promise.all([
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievement: { select: { key: true } } },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { longestStreak: true },
    }),
    prisma.speechSession.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        overallScore: true,
        paceScore: true,
        vocalVarietyScore: true,
        clarityScore: true,
        confidenceScore: true,
        fillerWords: true,
        durationSeconds: true,
      },
    }),
  ]);

  if (sessions.length === 0) return;

  const alreadyUnlockedKeys = new Set(existingUnlocks.map((u) => u.achievement.key));
  const newlyUnlockedKeys = new Set<string>();
  let runningBest = 0;

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const fillerCount = Array.isArray(s.fillerWords) ? s.fillerWords.length : 0;

    const ctx: AchievementContext = {
      session: {
        overallScore: s.overallScore,
        wpm: 0,
        fillerWordCount: fillerCount,
        durationSeconds: s.durationSeconds,
        confidenceScore: s.confidenceScore,
        clarityScore: s.clarityScore,
        paceScore: s.paceScore,
        vocalVarietyScore: s.vocalVarietyScore,
      },
      stats: {
        // Sessions-so-far as of this point in history, not the final total —
        // this is what makes personal_best replay correctly (it requires
        // more than one *prior* session) and it's what a milestone count
        // achievement would have seen had it been evaluated live.
        totalSessions: i + 1,
        bestOverallScore: runningBest,
        // Per-session historical streak isn't stored, so the account's
        // peak-ever streak is the best available stand-in for "did this
        // account ever reach an N-day streak".
        currentStreak: user.longestStreak,
        longestStreak: user.longestStreak,
      },
    };

    const matched = checkNewlyUnlockedAchievements(
      ctx,
      new Set([...alreadyUnlockedKeys, ...newlyUnlockedKeys]),
    );
    for (const m of matched) newlyUnlockedKeys.add(m.key);

    if (s.overallScore > runningBest) runningBest = s.overallScore;
  }

  const newlyUnlocked = ACHIEVEMENTS.filter((a) => newlyUnlockedKeys.has(a.key));
  if (newlyUnlocked.length === 0) return;

  const xpTotal = newlyUnlocked.reduce((sum, a) => sum + a.xpReward, 0);
  const coinTotal = newlyUnlocked.reduce((sum, a) => sum + a.coinReward, 0);

  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: xpTotal }, coins: { increment: coinTotal } },
  });

  await prisma.xPLog.createMany({
    data: newlyUnlocked.map((a) => ({
      userId,
      amount: a.xpReward,
      reason: `achievement:${a.key}`,
    })),
  });

  const achievementRows = await Promise.all(
    newlyUnlocked.map((a) =>
      prisma.achievement.upsert({
        where: { key: a.key },
        update: {},
        create: {
          key: a.key,
          name: a.name,
          description: a.description,
          icon: a.icon,
          xpReward: a.xpReward,
          coinReward: a.coinReward,
        },
      }),
    ),
  );
  await prisma.userAchievement.createMany({
    data: achievementRows.map((row) => ({ userId, achievementId: row.id })),
    skipDuplicates: true,
  });
}

export async function listAchievementsForUser(userId: string): Promise<AchievementListItem[]> {
  await backfillAchievements(userId);

  const unlocks = await prisma.userAchievement.findMany({
    where: { userId },
    select: { unlockedAt: true, achievement: { select: { key: true } } },
  });
  const unlockedMap = new Map(unlocks.map((u) => [u.achievement.key, u.unlockedAt]));

  return ACHIEVEMENTS.map((a) => ({
    key: a.key,
    name: a.name,
    description: a.description,
    icon: a.icon,
    xpReward: a.xpReward,
    coinReward: a.coinReward,
    unlocked: unlockedMap.has(a.key),
    unlockedAt: unlockedMap.get(a.key) ?? null,
  }));
}
