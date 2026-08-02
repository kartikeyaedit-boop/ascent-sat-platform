import { apiFetch } from "@/lib/api-client";
import type { WordTimestamp, AudioSample } from "@/lib/speech-metrics";

export interface SpeechSessionRecord {
  id: string;
  userId: string;
  mode: string;
  promptText: string | null;
  transcript: string;
  durationSeconds: number;
  wpm: number;
  fillerWords: { word: string; timestampMs: number }[];
  pauseCount: number;
  longPauseCount: number;
  avgPauseMs: number;
  confidenceScore: number;
  confidenceExplanation: string[];
  clarityScore: number;
  paceScore: number;
  vocalVarietyScore: number;
  overallScore: number;
  createdAt: string;
}

export interface CoachingFeedbackRecord {
  id: string;
  strengths: string[];
  weaknesses: string[];
  actionPlan: string[];
  practiceDrills: string[];
  motivationalNote: string;
}

export interface CreateSpeechSessionInput {
  mode: string;
  promptText?: string | null;
  transcript: string;
  durationSeconds: number;
  wordTimestamps: WordTimestamp[];
  pitchSamples: AudioSample[];
  volumeSamples: AudioSample[];
}

export function createSpeechSession(input: CreateSpeechSessionInput) {
  return apiFetch<{ session: SpeechSessionRecord; feedback: CoachingFeedbackRecord | null }>(
    "/api/speech/sessions",
    { method: "POST", body: input },
  );
}

export function fetchSpeechSession(id: string) {
  return apiFetch<{
    session: SpeechSessionRecord & { feedback: CoachingFeedbackRecord | null };
  }>(`/api/speech/sessions/${id}`);
}
