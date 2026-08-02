/**
 * Speech scoring engine — pure functions, no I/O.
 *
 * Used BOTH client-side (live scores while recording) and server-side (the
 * authoritative recompute on submit — client-reported numbers are never
 * trusted directly, see POST /api/speech/sessions). Same math, one source
 * of truth, so live and final scores never disagree.
 *
 * Every score here comes from a real measured signal — word timings from
 * speech recognition, and pitch/volume/spectral-clarity sampled directly
 * from the Web Audio API — combined via a documented, explainable formula.
 * None of it is a trained ML model: there's no labeled training data to
 * train one on, and a black-box score would violate the product's core
 * promise of always explaining *why* a score is what it is.
 *
 * Clarity specifically used to come from the speech-to-text engine's
 * per-word confidence, but browsers (Chrome in particular) frequently just
 * don't populate that field — it silently fell back to a constant and
 * stopped measuring anything. It now comes from real-time spectral
 * analysis instead (see computeClarityScore below), which is always a
 * genuine measurement.
 */

export interface WordTimestamp {
  word: string;
  startMs: number;
  endMs: number;
  /** Speech-to-text engine's own confidence for this word, 0-1. */
  confidence: number;
}

export interface AudioSample {
  atMs: number;
  value: number;
}

export interface FillerOccurrence {
  word: string;
  timestampMs: number;
}

export type PauseClassification = "natural" | "long" | "awkward";

export interface PauseInfo {
  afterWordIndex: number;
  startMs: number;
  durationMs: number;
  classification: PauseClassification;
}

export interface PauseAnalysis {
  pauses: PauseInfo[];
  pauseCount: number;
  longPauseCount: number;
  avgPauseMs: number;
  score: number;
}

export interface PaceResult {
  wpm: number;
  score: number;
  label: "too slow" | "slightly slow" | "ideal" | "slightly fast" | "too fast";
}

export interface VocalVarietyResult {
  score: number;
  pitchCoefficientOfVariation: number;
  volumeCoefficientOfVariation: number;
}

export interface ConfidenceResult {
  score: number;
  explanation: string[];
}

// --- Tunable thresholds, documented so the scoring is auditable. ---

/** General-purpose target range; Phase 2 will make this mode-specific
 * (conversational vs. TED-style vs. interview all have different ideal
 * paces). Sourced from commonly cited public-speaking pace guidance. */
const IDEAL_WPM_RANGE = { min: 120, max: 160 };

const PAUSE_THRESHOLDS_MS = {
  /** Below this, it's just natural word spacing, not a "pause". */
  minGap: 300,
  /** 300ms-1500ms: a natural breathing/emphasis pause. */
  longMin: 1500,
  /** >3000ms: reads as hesitant/awkward rather than deliberate. */
  awkwardMin: 3000,
};

const SINGLE_WORD_FILLERS = new Set([
  "um",
  "umm",
  "uh",
  "uhh",
  "like",
  "basically",
  "literally",
  "actually",
]);

const TWO_WORD_FILLERS = new Set(["you know", "sort of", "kind of"]);

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

export function calculateWpm(words: WordTimestamp[], durationSeconds: number): number {
  if (durationSeconds <= 0 || words.length === 0) return 0;
  return Math.round((words.length / durationSeconds) * 60);
}

export function scorePace(wpm: number): PaceResult {
  const { min, max } = IDEAL_WPM_RANGE;

  if (wpm === 0) return { wpm, score: 0, label: "too slow" };

  if (wpm >= min && wpm <= max) {
    return { wpm, score: 100, label: "ideal" };
  }

  // Linear falloff outside the ideal range: full points inside the band,
  // dropping to 0 at 2x the distance from the nearest edge of a
  // same-sized band beyond it (i.e. by ~80wpm outside the range).
  const distance = wpm < min ? min - wpm : wpm - max;
  const falloffRange = max - min || 40;
  const score = Math.max(0, Math.round(100 - (distance / falloffRange) * 100));

  let label: PaceResult["label"];
  if (wpm < min) label = distance > falloffRange ? "too slow" : "slightly slow";
  else label = distance > falloffRange ? "too fast" : "slightly fast";

  return { wpm, score, label };
}

export function detectFillerWords(words: WordTimestamp[]): FillerOccurrence[] {
  const occurrences: FillerOccurrence[] = [];
  let i = 0;

  while (i < words.length) {
    const current = normalizeWord(words[i].word);
    const next = words[i + 1] ? normalizeWord(words[i + 1].word) : "";
    const bigram = `${current} ${next}`;

    if (next && TWO_WORD_FILLERS.has(bigram)) {
      occurrences.push({ word: bigram, timestampMs: words[i].startMs });
      i += 2;
      continue;
    }

    if (SINGLE_WORD_FILLERS.has(current)) {
      occurrences.push({ word: current, timestampMs: words[i].startMs });
    }
    i += 1;
  }

  return occurrences;
}

export function analyzePauses(words: WordTimestamp[]): PauseAnalysis {
  const pauses: PauseInfo[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const gap = words[i + 1].startMs - words[i].endMs;
    if (gap < PAUSE_THRESHOLDS_MS.minGap) continue;

    const classification: PauseClassification =
      gap >= PAUSE_THRESHOLDS_MS.awkwardMin
        ? "awkward"
        : gap >= PAUSE_THRESHOLDS_MS.longMin
          ? "long"
          : "natural";

    pauses.push({ afterWordIndex: i, startMs: words[i].endMs, durationMs: gap, classification });
  }

  const longPauseCount = pauses.filter((p) => p.classification !== "natural").length;
  const avgPauseMs =
    pauses.length === 0 ? 0 : pauses.reduce((sum, p) => sum + p.durationMs, 0) / pauses.length;

  // Score: reward having *some* natural pauses (breath control, emphasis),
  // penalize a high proportion of long/awkward ones, and penalize having
  // essentially no pauses at all (rushing, no breath control) on a long take.
  let score: number;
  if (pauses.length === 0) {
    score = words.length > 40 ? 55 : 80; // only meaningfully penalize on longer speech
  } else {
    const awkwardRatio = longPauseCount / pauses.length;
    score = Math.max(0, Math.round(100 - awkwardRatio * 100));
  }

  return { pauses, pauseCount: pauses.length, longPauseCount, avgPauseMs, score };
}

function coefficientOfVariation(values: number[]): number {
  const filtered = values.filter((v) => v > 0);
  if (filtered.length < 2) return 0;
  const mean = filtered.reduce((s, v) => s + v, 0) / filtered.length;
  if (mean === 0) return 0;
  const variance = filtered.reduce((s, v) => s + (v - mean) ** 2, 0) / filtered.length;
  return Math.sqrt(variance) / mean;
}

/** Maps a value to 0-100, peaking in a healthy target band and dropping
 * off on either side (e.g. a coefficient of variation that's healthiest
 * in the middle — too low reads as monotone, too high as erratic). */
export function scoreInBand(value: number, idealMin: number, idealMax: number): number {
  if (value >= idealMin && value <= idealMax) return 100;
  const distance = value < idealMin ? idealMin - value : value - idealMax;
  const band = idealMax - idealMin || idealMin;
  return Math.max(0, Math.round(100 - (distance / band) * 100));
}

export function computeVocalVarietyScore(
  pitchSamples: AudioSample[],
  volumeSamples: AudioSample[],
): VocalVarietyResult {
  if (pitchSamples.length === 0 && volumeSamples.length === 0) {
    return { score: 0, pitchCoefficientOfVariation: 0, volumeCoefficientOfVariation: 0 };
  }

  const pitchCoV = coefficientOfVariation(pitchSamples.map((s) => s.value));
  const volumeCoV = coefficientOfVariation(volumeSamples.map((s) => s.value));

  const pitchScore = scoreInBand(pitchCoV, 0.12, 0.35);
  const volumeScore = scoreInBand(volumeCoV, 0.1, 0.4);

  return {
    score: Math.round(pitchScore * 0.6 + volumeScore * 0.4),
    pitchCoefficientOfVariation: pitchCoV,
    volumeCoefficientOfVariation: volumeCoV,
  };
}

/** Ideal fraction of energy in the 2-8kHz "presence" band (see
 * computeSpectralClarity in audio-analysis.ts) — a starting calibration
 * based on typical speech spectra, not yet tuned against real usage data. */
const CLARITY_RATIO_RANGE = { min: 0.12, max: 0.35 };

/**
 * Clarity from real-time spectral analysis of the mic input (see
 * computeSpectralClarity in audio-analysis.ts) — how much high-frequency
 * "presence" energy (crisp consonants) was present relative to the full
 * speech band, averaged across the session. A genuine acoustic
 * measurement every time, unlike speech-to-text confidence (see the
 * module docstring above for why that was replaced).
 */
export function computeClarityScore(claritySamples: AudioSample[]): number {
  if (claritySamples.length === 0) return 0;
  const avgRatio = claritySamples.reduce((sum, s) => sum + s.value, 0) / claritySamples.length;
  return scoreInBand(avgRatio, CLARITY_RATIO_RANGE.min, CLARITY_RATIO_RANGE.max);
}

export function computeConfidenceScore(input: {
  paceScore: number;
  fillerCount: number;
  wordCount: number;
  pauseScore: number;
  vocalVarietyScore: number;
  pace: PaceResult;
}): ConfidenceResult {
  const fillerPer100Words = input.wordCount > 0 ? (input.fillerCount / input.wordCount) * 100 : 0;
  const fillerScore = Math.max(0, Math.round(100 - fillerPer100Words * 15));

  const score = Math.round(
    input.paceScore * 0.35 +
      fillerScore * 0.3 +
      input.pauseScore * 0.2 +
      input.vocalVarietyScore * 0.15,
  );

  const explanation: string[] = [];

  if (input.pace.label === "ideal") {
    explanation.push(`Your pace (${input.pace.wpm} wpm) was right in the ideal range.`);
  } else {
    explanation.push(`Your pace (${input.pace.wpm} wpm) was ${input.pace.label}, which cost you some points.`);
  }

  if (fillerPer100Words < 1) {
    explanation.push("You used almost no filler words — very clean delivery.");
  } else if (fillerPer100Words < 3) {
    explanation.push(`You used a few filler words (about ${Math.round(fillerPer100Words)} per 100 words).`);
  } else {
    explanation.push(`Filler words showed up often (about ${Math.round(fillerPer100Words)} per 100 words), which pulled your score down.`);
  }

  if (input.pauseScore >= 80) {
    explanation.push("Your pauses felt natural and controlled.");
  } else {
    explanation.push("Several pauses felt long or hesitant rather than deliberate.");
  }

  if (input.vocalVarietyScore < 50) {
    explanation.push("Your voice stayed fairly flat, which can read as less engaged.");
  }

  return { score, explanation };
}

export function computeOverallScore(scores: {
  confidenceScore: number;
  clarityScore: number;
  paceScore: number;
  vocalVarietyScore: number;
}): number {
  return Math.round(
    scores.confidenceScore * 0.35 +
      scores.clarityScore * 0.25 +
      scores.paceScore * 0.2 +
      scores.vocalVarietyScore * 0.2,
  );
}
