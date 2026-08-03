import { describe, it, expect } from "vitest";
import { generateCoachingFeedback } from "./coaching.service";

const baseInput = {
  mode: "impromptu",
  promptText: "Describe a time you overcame a challenge.",
  transcript: "So um I think the key thing was just staying calm and thinking clearly.",
  metrics: {
    wpm: 140,
    paceLabel: "ideal",
    fillerWordCount: 1,
    pauseCount: 3,
    longPauseCount: 0,
    confidenceScore: 78,
    clarityScore: 85,
    vocalVarietyScore: 75,
    overallScore: 79,
  },
};

describe("generateCoachingFeedback", () => {
  it("always returns a non-empty array for every feedback category", () => {
    const result = generateCoachingFeedback(baseInput);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.weaknesses.length).toBeGreaterThan(0);
    expect(result.actionPlan.length).toBeGreaterThan(0);
    expect(result.practiceDrills.length).toBeGreaterThan(0);
    expect(result.motivationalNote.length).toBeGreaterThan(0);
  });

  it("produces a summary mentioning the overall score, the top strength, and the top weakness", () => {
    const result = generateCoachingFeedback(baseInput);
    expect(result.summary).toContain(`${baseInput.metrics.overallScore}/100`);
    expect(result.summary).toContain(result.strengths[0]);
    expect(result.summary).toContain(result.weaknesses[0]);
  });

  it("labels a high-scoring session as excellent/strong and a low-scoring one as rough", () => {
    const strong = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, overallScore: 90 },
    });
    const rough = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, overallScore: 25 },
    });
    expect(strong.summary).toMatch(/excellent|strong/);
    expect(rough.summary).toMatch(/rough/);
  });

  it("praises ideal pace as a strength", () => {
    const result = generateCoachingFeedback(baseInput);
    expect(result.strengths.some((s) => /ideal/.test(s))).toBe(true);
  });

  it("flags a too-fast pace as a weakness with a concrete fix", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, wpm: 220, paceLabel: "too fast" },
    });
    expect(result.weaknesses.some((w) => /fast/.test(w))).toBe(true);
    expect(result.practiceDrills.length).toBeGreaterThan(0);
  });

  it("flags a too-slow pace as a weakness", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, wpm: 70, paceLabel: "too slow" },
    });
    expect(result.weaknesses.some((w) => /slow/.test(w))).toBe(true);
  });

  it("praises zero filler words as a strength", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, fillerWordCount: 0 },
    });
    expect(result.strengths.some((s) => /clean/i.test(s))).toBe(true);
  });

  it("flags a high filler-word count as a weakness", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      transcript: "word ".repeat(50).trim(),
      metrics: { ...baseInput.metrics, fillerWordCount: 8 },
    });
    expect(result.weaknesses.some((w) => /filler/i.test(w))).toBe(true);
  });

  it("flags zero pauses as a weakness (rushing, no breath control)", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, pauseCount: 0, longPauseCount: 0 },
    });
    expect(result.weaknesses.some((w) => /pause/i.test(w))).toBe(true);
  });

  it("flags a flat/monotone voice as a weakness", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, vocalVarietyScore: 20 },
    });
    expect(result.weaknesses.some((w) => /flat/i.test(w))).toBe(true);
  });

  it("praises good vocal variety as a strength", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, vocalVarietyScore: 85 },
    });
    expect(result.strengths.some((s) => /energy|variation/i.test(s))).toBe(true);
  });

  it("gives a more encouraging motivational note for a low overall score", () => {
    const low = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, overallScore: 30 },
    });
    const high = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, overallScore: 95 },
    });
    expect(low.motivationalNote).not.toBe(high.motivationalNote);
  });

  it("is deterministic for the same input", () => {
    const a = generateCoachingFeedback(baseInput);
    const b = generateCoachingFeedback(baseInput);
    expect(a).toEqual(b);
  });

  it("says no speech was detected instead of a normal breakdown when wpm is 0", () => {
    const result = generateCoachingFeedback({
      ...baseInput,
      metrics: { ...baseInput.metrics, wpm: 0, overallScore: 0 },
    });
    expect(result.summary).toMatch(/no speech was detected/i);
    expect(result.weaknesses.some((w) => /no speech was detected/i.test(w))).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.actionPlan.some((a) => /microphone/i.test(a))).toBe(true);
  });
});
