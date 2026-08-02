import { z } from "zod";

export const wordTimestampSchema = z.object({
  word: z.string(),
  startMs: z.number().nonnegative(),
  endMs: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
});

export const audioSampleSchema = z.object({
  atMs: z.number().nonnegative(),
  value: z.number(),
});

export const createSessionSchema = z.object({
  mode: z.string().min(1).max(50),
  promptText: z.string().max(2000).nullable().optional(),
  transcript: z.string().min(1, "Transcript is required"),
  durationSeconds: z.number().positive(),
  wordTimestamps: z.array(wordTimestampSchema),
  pitchSamples: z.array(audioSampleSchema),
  volumeSamples: z.array(audioSampleSchema),
  claritySamples: z.array(audioSampleSchema),
});
