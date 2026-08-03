/**
 * Static achievement catalog. Each achievement is hand-written — not a
 * generic rules engine — because unlock conditions genuinely differ in
 * shape (a session-level score vs. a lifetime session count vs. a streak
 * length). This file is the single source of truth: the DB's Achievement
 * table is lazily upserted from these definitions the first time each one
 * unlocks (see gamification.service.ts), so there's nothing to keep in
 * sync by hand.
 */

export interface AchievementContext {
  session: {
    overallScore: number;
    wpm: number;
    fillerWordCount: number;
    durationSeconds: number;
    confidenceScore: number;
    clarityScore: number;
    paceScore: number;
    vocalVarietyScore: number;
  };
  /** Aggregate stats that already include the session above. */
  stats: {
    totalSessions: number;
    bestOverallScore: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  /** lucide-react icon component name. */
  icon: string;
  xpReward: number;
  coinReward: number;
  check: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "first_session",
    name: "First Steps",
    description: "Complete your first practice session.",
    icon: "Footprints",
    xpReward: 20,
    coinReward: 10,
    // >= rather than === : an account with pre-existing sessions from
    // before an achievement existed would otherwise sail past the exact
    // count and never unlock it. Safe because checkNewlyUnlockedAchievements
    // already filters out anything already unlocked.
    check: (ctx) => ctx.stats.totalSessions >= 1,
  },
  {
    key: "five_sessions",
    name: "Getting Warmed Up",
    description: "Complete 5 practice sessions.",
    icon: "Flame",
    xpReward: 30,
    coinReward: 15,
    check: (ctx) => ctx.stats.totalSessions >= 5,
  },
  {
    key: "twenty_five_sessions",
    name: "Dedicated Speaker",
    description: "Complete 25 practice sessions.",
    icon: "Award",
    xpReward: 75,
    coinReward: 40,
    check: (ctx) => ctx.stats.totalSessions >= 25,
  },
  {
    key: "hundred_sessions",
    name: "Century Club",
    description: "Complete 100 practice sessions.",
    icon: "Trophy",
    xpReward: 200,
    coinReward: 100,
    check: (ctx) => ctx.stats.totalSessions >= 100,
  },
  {
    key: "perfect_score",
    name: "Flawless",
    description: "Score a perfect 100 overall on a session.",
    icon: "Star",
    xpReward: 100,
    coinReward: 50,
    check: (ctx) => ctx.session.overallScore === 100,
  },
  {
    key: "score_90",
    name: "Excellence",
    description: "Score 90 or higher overall on a session.",
    icon: "Sparkles",
    xpReward: 40,
    coinReward: 20,
    check: (ctx) => ctx.session.overallScore >= 90,
  },
  {
    key: "personal_best",
    name: "New Personal Best",
    description: "Beat your previous best overall score.",
    icon: "TrendingUp",
    xpReward: 25,
    coinReward: 10,
    check: (ctx) => ctx.stats.totalSessions > 1 && ctx.session.overallScore >= ctx.stats.bestOverallScore,
  },
  {
    key: "no_fillers",
    name: "Crystal Clear",
    description: "Complete a session of at least 30 seconds with zero filler words.",
    icon: "Gem",
    xpReward: 40,
    coinReward: 20,
    check: (ctx) => ctx.session.fillerWordCount === 0 && ctx.session.durationSeconds >= 30,
  },
  {
    key: "streak_3",
    name: "On a Roll",
    description: "Practice 3 days in a row.",
    icon: "Zap",
    xpReward: 25,
    coinReward: 15,
    check: (ctx) => ctx.stats.currentStreak >= 3,
  },
  {
    key: "streak_7",
    name: "Week Warrior",
    description: "Practice 7 days in a row.",
    icon: "CalendarCheck",
    xpReward: 60,
    coinReward: 30,
    check: (ctx) => ctx.stats.currentStreak >= 7,
  },
  {
    key: "streak_30",
    name: "Unstoppable",
    description: "Practice 30 days in a row.",
    icon: "Rocket",
    xpReward: 300,
    coinReward: 150,
    check: (ctx) => ctx.stats.currentStreak >= 30,
  },
  {
    key: "pace_master",
    name: "Perfect Pace",
    description: "Land a perfect pace score on a session.",
    icon: "Gauge",
    xpReward: 30,
    coinReward: 15,
    check: (ctx) => ctx.session.paceScore === 100,
  },
  {
    key: "vocal_variety_master",
    name: "Dynamic Speaker",
    description: "Score 90 or higher on vocal variety.",
    icon: "AudioLines",
    xpReward: 30,
    coinReward: 15,
    check: (ctx) => ctx.session.vocalVarietyScore >= 90,
  },
  {
    key: "clarity_master",
    name: "Crisp and Clear",
    description: "Score 90 or higher on clarity.",
    icon: "Radio",
    xpReward: 30,
    coinReward: 15,
    check: (ctx) => ctx.session.clarityScore >= 90,
  },
  {
    key: "confidence_master",
    name: "Command of the Room",
    description: "Score 90 or higher on confidence.",
    icon: "Crown",
    xpReward: 30,
    coinReward: 15,
    check: (ctx) => ctx.session.confidenceScore >= 90,
  },
  {
    key: "marathon_speaker",
    name: "Marathon Speaker",
    description: "Complete a session lasting 5 minutes or more.",
    icon: "Timer",
    xpReward: 40,
    coinReward: 20,
    check: (ctx) => ctx.session.durationSeconds >= 300,
  },
];

/** Achievements the user hasn't unlocked yet whose condition is now met. */
export function checkNewlyUnlockedAchievements(
  ctx: AchievementContext,
  alreadyUnlockedKeys: ReadonlySet<string>,
): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => !alreadyUnlockedKeys.has(a.key) && a.check(ctx));
}
