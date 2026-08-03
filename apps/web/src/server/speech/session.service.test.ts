import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    speechSession: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    coachingFeedback: { create: vi.fn() },
  },
}));

vi.mock("./coaching.service", () => ({
  generateCoachingFeedback: vi.fn(),
}));

vi.mock("@/server/gamification/gamification.service", () => ({
  awardSessionRewards: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { generateCoachingFeedback } from "./coaching.service";
import { awardSessionRewards } from "@/server/gamification/gamification.service";
import { createSession, getSessionForUser, listSessionsForUser } from "./session.service";
import type { WordTimestamp } from "@/lib/speech-metrics";

const mockedPrisma = vi.mocked(prisma, { deep: true });
const mockedGenerateCoachingFeedback = vi.mocked(generateCoachingFeedback);
const mockedAwardSessionRewards = vi.mocked(awardSessionRewards);

function words(): WordTimestamp[] {
  return [
    { word: "Hello", startMs: 0, endMs: 300, confidence: 0.95 },
    { word: "world", startMs: 400, endMs: 700, confidence: 0.92 },
  ];
}

const baseInput = {
  userId: "user_1",
  mode: "impromptu",
  promptText: "Talk about anything.",
  transcript: "Hello world",
  durationSeconds: 5,
  wordTimestamps: words(),
  pitchSamples: [],
  volumeSamples: [],
  claritySamples: [],
};

const baseRewards = {
  xpAwarded: 20,
  coinsAwarded: 5,
  streakBonusXp: 0,
  currentStreak: 1,
  longestStreak: 1,
  isNewStreakDay: true,
  unlockedAchievements: [],
  totalXp: 20,
  totalCoins: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.speechSession.create.mockResolvedValue({ id: "session_1" } as never);
  mockedAwardSessionRewards.mockResolvedValue(baseRewards);
});

describe("createSession", () => {
  it("stores the session with server-computed scores, independent of feedback", async () => {
    mockedGenerateCoachingFeedback.mockReturnValue({
      summary: "This was a solid session. Clear delivery. Could vary pace more. Practice pausing.",
      strengths: ["Clear delivery."],
      weaknesses: ["Could vary pace more."],
      actionPlan: ["Practice pausing."],
      practiceDrills: ["Read a paragraph aloud, exaggerating pauses."],
      motivationalNote: "Nice work.",
    });
    mockedPrisma.coachingFeedback.create.mockResolvedValue({ id: "feedback_1" } as never);

    const result = await createSession(baseInput);

    expect(mockedPrisma.speechSession.create).toHaveBeenCalledOnce();
    const createArgs = mockedPrisma.speechSession.create.mock.calls[0][0];
    expect(createArgs.data.userId).toBe("user_1");
    expect(createArgs.data.confidenceExplanation).toBeInstanceOf(Array);
    expect(result.session).toEqual({ id: "session_1" });
    expect(result.feedback).toEqual({ id: "feedback_1" });
  });

  it("degrades to feedback: null instead of throwing when the feedback DB write fails", async () => {
    mockedGenerateCoachingFeedback.mockReturnValue({
      summary: "This was a solid session. Clear delivery. Could vary pace more. Practice pausing.",
      strengths: ["Clear delivery."],
      weaknesses: ["Could vary pace more."],
      actionPlan: ["Practice pausing."],
      practiceDrills: ["Read a paragraph aloud, exaggerating pauses."],
      motivationalNote: "Nice work.",
    });
    mockedPrisma.coachingFeedback.create.mockRejectedValue(new Error("DB unavailable"));

    const result = await createSession(baseInput);

    expect(result.session).toEqual({ id: "session_1" });
    expect(result.feedback).toBeNull();
  });

  it("includes gamification rewards from awardSessionRewards", async () => {
    mockedGenerateCoachingFeedback.mockReturnValue({
      summary: "This was a session. Nice work.",
      strengths: [],
      weaknesses: [],
      actionPlan: [],
      practiceDrills: [],
      motivationalNote: "Nice work.",
    });
    mockedPrisma.coachingFeedback.create.mockResolvedValue({ id: "feedback_1" } as never);

    const result = await createSession(baseInput);

    expect(mockedAwardSessionRewards).toHaveBeenCalledOnce();
    expect(mockedAwardSessionRewards.mock.calls[0]![0]!.sessionId).toBe("session_1");
    expect(result.rewards).toEqual(baseRewards);
  });

  it("degrades to rewards: null instead of throwing when reward-awarding fails", async () => {
    mockedGenerateCoachingFeedback.mockReturnValue({
      summary: "This was a session. Nice work.",
      strengths: [],
      weaknesses: [],
      actionPlan: [],
      practiceDrills: [],
      motivationalNote: "Nice work.",
    });
    mockedPrisma.coachingFeedback.create.mockResolvedValue({ id: "feedback_1" } as never);
    mockedAwardSessionRewards.mockRejectedValue(new Error("DB unavailable"));

    const result = await createSession(baseInput);

    expect(result.session).toEqual({ id: "session_1" });
    expect(result.rewards).toBeNull();
  });

  it("forces every score to 0 and skips rewards entirely for a session with no detected speech", async () => {
    mockedGenerateCoachingFeedback.mockReturnValue({
      summary: "No speech was detected.",
      strengths: [],
      weaknesses: [],
      actionPlan: [],
      practiceDrills: [],
      motivationalNote: "Try again.",
    });
    mockedPrisma.coachingFeedback.create.mockResolvedValue({ id: "feedback_1" } as never);

    await createSession({ ...baseInput, transcript: "", wordTimestamps: [] });

    const createArgs = mockedPrisma.speechSession.create.mock.calls[0][0];
    expect(createArgs.data.wpm).toBe(0);
    expect(createArgs.data.overallScore).toBe(0);
    expect(createArgs.data.confidenceScore).toBe(0);
    expect(createArgs.data.clarityScore).toBe(0);
    expect(createArgs.data.paceScore).toBe(0);
    expect(createArgs.data.vocalVarietyScore).toBe(0);
    expect(mockedAwardSessionRewards).not.toHaveBeenCalled();
  });

  it("detects a real pause from volume data even though the word timestamps are back-to-back", async () => {
    mockedGenerateCoachingFeedback.mockReturnValue({
      summary: "s",
      strengths: [],
      weaknesses: [],
      actionPlan: [],
      practiceDrills: [],
      motivationalNote: "m",
    });
    mockedPrisma.coachingFeedback.create.mockResolvedValue({ id: "feedback_1" } as never);

    // Word timestamps show no gap at all (as the approximation would if a
    // pause happened mid-phrase, before the recognizer finalized) — the
    // real pause only shows up in the volume timeline.
    const backToBackWords = [
      { word: "hello", startMs: 0, endMs: 200, confidence: 0.9 },
      { word: "world", startMs: 200, endMs: 400, confidence: 0.9 },
    ];
    const volumeSamples = [
      { atMs: 0, value: 0.2 },
      { atMs: 150, value: 0.2 },
      ...Array.from({ length: 8 }, (_, i) => ({ atMs: 300 + i * 150, value: 0.001 })), // ~1.2s pause
      { atMs: 1500, value: 0.2 },
      { atMs: 1650, value: 0.2 },
    ];

    await createSession({ ...baseInput, wordTimestamps: backToBackWords, volumeSamples });

    const createArgs = mockedPrisma.speechSession.create.mock.calls[0][0];
    expect(createArgs.data.pauseCount).toBeGreaterThan(0);
  });
});

describe("getSessionForUser", () => {
  it("throws NOT_FOUND when the session doesn't exist", async () => {
    mockedPrisma.speechSession.findUnique.mockResolvedValue(null);
    await expect(getSessionForUser("session_1", "user_1")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws NOT_FOUND when the session belongs to a different user", async () => {
    mockedPrisma.speechSession.findUnique.mockResolvedValue({
      id: "session_1",
      userId: "someone_else",
    } as never);
    await expect(getSessionForUser("session_1", "user_1")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("returns the session when it belongs to the requesting user", async () => {
    mockedPrisma.speechSession.findUnique.mockResolvedValue({
      id: "session_1",
      userId: "user_1",
    } as never);
    const result = await getSessionForUser("session_1", "user_1");
    expect(result.id).toBe("session_1");
  });
});

describe("listSessionsForUser", () => {
  it("paginates and scopes the query to the requesting user", async () => {
    mockedPrisma.speechSession.findMany.mockResolvedValue([{ id: "s1" }, { id: "s2" }] as never);
    mockedPrisma.speechSession.count.mockResolvedValue(25 as never);

    const result = await listSessionsForUser("user_1", 2);

    const findManyArgs = mockedPrisma.speechSession.findMany.mock.calls[0]![0]!;
    expect(findManyArgs.where).toEqual({ userId: "user_1" });
    expect(findManyArgs.skip).toBe(10);
    expect(findManyArgs.take).toBe(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
    expect(result.sessions).toHaveLength(2);
  });
});
