import { prisma } from "@/lib/prisma";
import { SpeechErrors } from "@/lib/errors";
import {
  calculateWpm,
  scorePace,
  detectFillerWords,
  analyzePauses,
  computeVocalVarietyScore,
  computeClarityScore,
  computeConfidenceScore,
  computeOverallScore,
  type WordTimestamp,
  type AudioSample,
} from "@/lib/speech-metrics";
import { generateCoachingFeedback } from "./coaching.service";

export interface CreateSessionInput {
  userId: string;
  mode: string;
  promptText?: string | null;
  transcript: string;
  durationSeconds: number;
  wordTimestamps: WordTimestamp[];
  pitchSamples: AudioSample[];
  volumeSamples: AudioSample[];
  claritySamples: AudioSample[];
}

/**
 * Recomputes every score authoritatively from the submitted transcript and
 * timestamps — client-reported live scores are never trusted directly, even
 * though the client computes the same numbers (via the same pure functions)
 * for in-progress display while recording. See docs/architecture.md.
 */
export async function createSession(input: CreateSessionInput) {
  const wpm = calculateWpm(input.wordTimestamps, input.durationSeconds);
  const pace = scorePace(wpm);
  const fillerWords = detectFillerWords(input.wordTimestamps);
  const pauseAnalysis = analyzePauses(input.wordTimestamps);
  const vocalVariety = computeVocalVarietyScore(input.pitchSamples, input.volumeSamples);
  const clarityScore = computeClarityScore(input.claritySamples);

  const confidence = computeConfidenceScore({
    paceScore: pace.score,
    fillerCount: fillerWords.length,
    wordCount: input.wordTimestamps.length,
    pauseScore: pauseAnalysis.score,
    vocalVarietyScore: vocalVariety.score,
    pace,
  });

  const overallScore = computeOverallScore({
    confidenceScore: confidence.score,
    clarityScore,
    paceScore: pace.score,
    vocalVarietyScore: vocalVariety.score,
  });

  const session = await prisma.speechSession.create({
    data: {
      userId: input.userId,
      mode: input.mode,
      promptText: input.promptText ?? null,
      transcript: input.transcript,
      durationSeconds: Math.round(input.durationSeconds),
      wpm,
      fillerWords: fillerWords as unknown as object,
      pauseCount: pauseAnalysis.pauseCount,
      longPauseCount: pauseAnalysis.longPauseCount,
      avgPauseMs: pauseAnalysis.avgPauseMs,
      confidenceScore: confidence.score,
      confidenceExplanation: confidence.explanation,
      clarityScore,
      paceScore: pace.score,
      vocalVarietyScore: vocalVariety.score,
      overallScore,
    },
  });

  // The scores above are already stored and valuable on their own — a
  // transient DB failure writing the feedback row shouldn't destroy the
  // whole session. generateCoachingFeedback itself is a pure function and
  // can't throw (no network call — see coaching.service.ts).
  let coachingFeedback = null;
  try {
    const feedback = generateCoachingFeedback({
      mode: input.mode,
      promptText: input.promptText ?? null,
      transcript: input.transcript,
      metrics: {
        wpm,
        paceLabel: pace.label,
        fillerWordCount: fillerWords.length,
        pauseCount: pauseAnalysis.pauseCount,
        longPauseCount: pauseAnalysis.longPauseCount,
        confidenceScore: confidence.score,
        clarityScore,
        vocalVarietyScore: vocalVariety.score,
        overallScore,
      },
    });

    coachingFeedback = await prisma.coachingFeedback.create({
      data: {
        sessionId: session.id,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        actionPlan: feedback.actionPlan,
        practiceDrills: feedback.practiceDrills,
        motivationalNote: feedback.motivationalNote,
      },
    });
  } catch (err) {
    console.error(`Coaching feedback generation failed for session ${session.id}:`, err);
  }

  return { session, feedback: coachingFeedback };
}

export async function getSessionForUser(sessionId: string, userId: string) {
  const session = await prisma.speechSession.findUnique({
    where: { id: sessionId },
    include: { feedback: true },
  });

  if (!session || session.userId !== userId) {
    throw SpeechErrors.sessionNotFound();
  }

  return session;
}

const SESSIONS_PAGE_SIZE = 10;

export async function listSessionsForUser(userId: string, page: number) {
  const skip = (page - 1) * SESSIONS_PAGE_SIZE;

  const [sessions, total] = await Promise.all([
    prisma.speechSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: SESSIONS_PAGE_SIZE,
      select: {
        id: true,
        mode: true,
        promptText: true,
        durationSeconds: true,
        wpm: true,
        overallScore: true,
        confidenceScore: true,
        createdAt: true,
      },
    }),
    prisma.speechSession.count({ where: { userId } }),
  ]);

  return {
    sessions,
    page,
    pageSize: SESSIONS_PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / SESSIONS_PAGE_SIZE)),
  };
}
