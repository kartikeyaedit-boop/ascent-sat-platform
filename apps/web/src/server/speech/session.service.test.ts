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

import { prisma } from "@/lib/prisma";
import { generateCoachingFeedback } from "./coaching.service";
import { createSession, getSessionForUser, listSessionsForUser } from "./session.service";
import type { WordTimestamp } from "@/lib/speech-metrics";

const mockedPrisma = vi.mocked(prisma, { deep: true });
const mockedGenerateCoachingFeedback = vi.mocked(generateCoachingFeedback);

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

beforeEach(() => {
  vi.clearAllMocks();
  mockedPrisma.speechSession.create.mockResolvedValue({ id: "session_1" } as never);
});

describe("createSession", () => {
  it("stores the session with server-computed scores, independent of feedback", async () => {
    mockedGenerateCoachingFeedback.mockReturnValue({
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
