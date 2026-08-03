import { prisma } from "@/lib/prisma";
import { SpeechErrors } from "@/lib/errors";
import {
  calculateWpm,
  scorePace,
  detectFillerWords,
  analyzePauses,
  analyzePausesFromVolume,
  computeVocalVarietyScore,
  computeClarityScore,
  computeConfidenceScore,
  computeOverallScore,
  type WordTimestamp,
  type AudioSample,
} from "@/lib/speech-metrics";
import { generateCoachingFeedback } from "./coaching.service";
import { awardSessionRewards, type SessionRewardsResult } from "@/server/gamification/gamification.service";

/** Below this many volume samples (~1.5s of the client's 150ms sampling
 * interval), there's too little data to trust real-silence-based pause
 * detection — fall back to the word-timestamp-gap approximation instead
 * of treating "we barely sampled anything" as "there were no pauses". */
const MIN_VOLUME_SAMPLES_FOR_PAUSE_DETECTION = 10;

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
  // Prefer real silence detection from mic volume over the word-timestamp-gap
  // approximation — see analyzePausesFromVolume's docstring for why the
  // word-gap method can miss a pause entirely (it can only see gaps between
  // already-finalized speech-recognition chunks, not silence that happened
  // inside one).
  const pauseAnalysis =
    input.volumeSamples.length >= MIN_VOLUME_SAMPLES_FOR_PAUSE_DETECTION
      ? analyzePausesFromVolume(input.volumeSamples, input.wordTimestamps.length)
      : analyzePauses(input.wordTimestamps);
  const vocalVariety = computeVocalVarietyScore(input.pitchSamples, input.volumeSamples);
  const clarityScore = computeClarityScore(input.claritySamples);

  // No words were transcribed at all — there's nothing to meaningfully
  // score. Without this guard, fallback defaults tuned for short *spoken*
  // clips (e.g. the zero-pause baseline) would leak in and produce a
  // confusingly nonzero score for a session where nothing was said.
  const isSilent = wpm === 0;

  const confidence = isSilent
    ? { score: 0, explanation: ["No speech was detected in this session."] }
    : computeConfidenceScore({
        paceScore: pace.score,
        fillerCount: fillerWords.length,
        wordCount: input.wordTimestamps.length,
        pauseScore: pauseAnalysis.score,
        vocalVarietyScore: vocalVariety.score,
        pace,
      });

  const finalClarityScore = isSilent ? 0 : clarityScore;
  const finalVocalVarietyScore = isSilent ? 0 : vocalVariety.score;

  const overallScore = isSilent
    ? 0
    : computeOverallScore({
        confidenceScore: confidence.score,
        clarityScore: finalClarityScore,
        paceScore: pace.score,
        vocalVarietyScore: finalVocalVarietyScore,
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
      clarityScore: finalClarityScore,
      paceScore: pace.score,
      vocalVarietyScore: finalVocalVarietyScore,
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
        clarityScore: finalClarityScore,
        vocalVarietyScore: finalVocalVarietyScore,
        overallScore,
      },
    });

    coachingFeedback = await prisma.coachingFeedback.create({
      data: {
        sessionId: session.id,
        summary: feedback.summary,
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

  // Same non-fatal-failure principle as coaching feedback above: rewards
  // are a bonus on top of an already-stored session, not a prerequisite.
  // Silent sessions earn nothing — there's no practice to reward, and
  // awarding base XP for empty recordings would be an easy farm.
  let rewards: SessionRewardsResult | null = null;
  if (!isSilent) {
    try {
      rewards = await awardSessionRewards({
        userId: input.userId,
        sessionId: session.id,
        overallScore,
        wpm,
        fillerWordCount: fillerWords.length,
        durationSeconds: Math.round(input.durationSeconds),
        confidenceScore: confidence.score,
        clarityScore: finalClarityScore,
        paceScore: pace.score,
        vocalVarietyScore: finalVocalVarietyScore,
      });
    } catch (err) {
      console.error(`Gamification rewards failed for session ${session.id}:`, err);
    }
  }

  return { session, feedback: coachingFeedback, rewards };
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
