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

import { SILENCE_RMS_THRESHOLD } from "./audio-analysis";

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
 * paces). 120-160 wpm is the commonly cited "engaging presentation" sweet
 * spot (e.g. Toastmasters guidance, National Center for Voice and Speech
 * figures for conversational English), but real speakers vary a lot
 * around it without sounding bad — a deliberate 100 wpm or an energetic
 * 175 wpm both read as perfectly normal, just different styles. */
const IDEAL_WPM_RANGE = { min: 120, max: 160 };

/** How far outside the ideal band you can be before hitting 0. Wider than
 * the band itself (was equal to it, i.e. 40 — meaning 80wpm or 200wpm
 * already scored 0, which is far too harsh for a genuinely normal,
 * unhurried speaking pace). 90 means the floor isn't reached until ~30wpm
 * or ~250wpm — clearly-extreme rates — while anything in between still
 * loses only proportionally modest points. */
const PACE_FALLOFF_RANGE = 90;

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

  // Linear falloff outside the ideal range — see PACE_FALLOFF_RANGE for why
  // this is intentionally gentle rather than a steep cliff.
  const distance = wpm < min ? min - wpm : wpm - max;
  const score = Math.max(0, Math.round(100 - (distance / PACE_FALLOFF_RANGE) * 100));

  let label: PaceResult["label"];
  if (wpm < min) label = distance > PACE_FALLOFF_RANGE / 2 ? "too slow" : "slightly slow";
  else label = distance > PACE_FALLOFF_RANGE / 2 ? "too fast" : "slightly fast";

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

/** Points deducted per pause by severity. A ratio-based score (what
 * fraction of pauses were "bad") is unstable with only a handful of data
 * points — a single genuine 2-second thinking pause is 100% of a
 * one-pause session's pauses, which would zero out the whole dimension
 * even though one unhurried pause is completely normal. Deducting a fixed
 * amount per pause instead means one long pause costs a little, not
 * everything, while a session full of them still adds up to a real
 * penalty. "Long" (1.5-3s) is deliberately cheap — linguistically that's
 * still a normal thinking/emphasis pause, not a stumble; "awkward" (>3s)
 * costs much more since that's the range that actually reads as hesitant. */
const PAUSE_PENALTY = {
  long: 8,
  awkward: 25,
};

function scorePauseQuality(pauses: PauseInfo[], wordCount: number): number {
  if (pauses.length === 0) {
    // Never pausing at all is itself often a rushed/hesitant pattern, not a
    // neutral default — still scaled down for very short takes that
    // genuinely may not need one.
    return wordCount > 40 ? 40 : 60;
  }

  const penalty = pauses.reduce((sum, p) => {
    if (p.classification === "long") return sum + PAUSE_PENALTY.long;
    if (p.classification === "awkward") return sum + PAUSE_PENALTY.awkward;
    return sum;
  }, 0);

  return Math.max(0, Math.round(100 - penalty));
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
  const score = scorePauseQuality(pauses, words.length);

  return { pauses, pauseCount: pauses.length, longPauseCount, avgPauseMs, score };
}

/**
 * Detects pauses from real microphone volume data (RMS sampled roughly
 * every 150ms during recording) instead of word-level timestamps.
 *
 * Word timing is only ever an *approximation* — the browser's Speech
 * Recognition API doesn't expose real per-word timestamps, so
 * use-speech-session.ts estimates them by evenly spreading each finalized
 * phrase's words across a guessed time span. That approximation has a
 * blind spot: if a pause happens in the middle of a phrase the recognizer
 * hasn't finalized yet, the eventual chunk's words get spread evenly
 * across the *whole* span with no way to represent the pause that
 * happened partway through it — the pause silently disappears.
 *
 * Volume is a real, continuous measurement sampled independently of
 * whatever the speech recognizer is doing internally, so a genuine
 * silence always shows up directly. This is the preferred pause-detection
 * method whenever enough volume data exists (see session.service.ts for
 * the fallback to the word-gap method when it doesn't).
 */
export function analyzePausesFromVolume(
  volumeSamples: AudioSample[],
  wordCount: number,
): PauseAnalysis {
  const sorted = [...volumeSamples].sort((a, b) => a.atMs - b.atMs);
  const pauses: PauseInfo[] = [];
  let silenceStartMs: number | null = null;

  for (const sample of sorted) {
    const isSilent = sample.value < SILENCE_RMS_THRESHOLD;
    if (isSilent) {
      if (silenceStartMs === null) silenceStartMs = sample.atMs;
      continue;
    }

    if (silenceStartMs !== null) {
      const durationMs = sample.atMs - silenceStartMs;
      if (durationMs >= PAUSE_THRESHOLDS_MS.minGap) {
        const classification: PauseClassification =
          durationMs >= PAUSE_THRESHOLDS_MS.awkwardMin
            ? "awkward"
            : durationMs >= PAUSE_THRESHOLDS_MS.longMin
              ? "long"
              : "natural";
        // No word-index concept on a timeline-based detection — the
        // detailed pause list isn't persisted anyway (see session.service.ts).
        pauses.push({ afterWordIndex: -1, startMs: silenceStartMs, durationMs, classification });
      }
      silenceStartMs = null;
    }
  }
  // A silence run still open at the end of the loop is trailing silence
  // (the user stopped talking, then clicked stop) rather than a mid-speech
  // pause, so it's intentionally not counted.

  const longPauseCount = pauses.filter((p) => p.classification !== "natural").length;
  const avgPauseMs =
    pauses.length === 0 ? 0 : pauses.reduce((sum, p) => sum + p.durationMs, 0) / pauses.length;
  const score = scorePauseQuality(pauses, wordCount);

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
  // Filler words are one of the most perceptible signs of a rough delivery,
  // so they're penalized more steeply (was *15) and weighted as the largest
  // single factor below — previously pace carried the most weight, which
  // let a session with heavy filler use score fine as long as pace happened
  // to be in range.
  const fillerPer100Words = input.wordCount > 0 ? (input.fillerCount / input.wordCount) * 100 : 0;
  const fillerScore = Math.max(0, Math.round(100 - fillerPer100Words * 18));

  const score = Math.round(
    fillerScore * 0.35 +
      input.paceScore * 0.25 +
      input.pauseScore * 0.2 +
      input.vocalVarietyScore * 0.2,
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
  // Pace's weight here is intentionally smaller than it looks — it's also
  // baked into confidenceScore (see computeConfidenceScore), so counting it
  // heavily in both places let a good pace alone carry a mediocre session.
  const weighted =
    scores.confidenceScore * 0.35 +
    scores.clarityScore * 0.3 +
    scores.paceScore * 0.15 +
    scores.vocalVarietyScore * 0.2;

  // A pure weighted average lets one badly-failing dimension hide behind
  // decent scores elsewhere. Blending in the weakest component pulls the
  // overall score down further whenever something is genuinely bad — closer
  // to how a human listener would grade a session that's bad in one glaring
  // way, rather than treating every dimension as independently forgivable.
  const weakest = Math.min(
    scores.confidenceScore,
    scores.clarityScore,
    scores.paceScore,
    scores.vocalVarietyScore,
  );

  return Math.round(weighted * 0.85 + weakest * 0.15);
}
