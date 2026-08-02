import { describe, it, expect } from "vitest";
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
} from "./speech-metrics";

function word(text: string, startMs: number, endMs: number, confidence = 0.95): WordTimestamp {
  return { word: text, startMs, endMs, confidence };
}

describe("calculateWpm", () => {
  it("computes words per minute from word count and duration", () => {
    const words = Array.from({ length: 150 }, (_, i) => word(`w${i}`, i * 400, i * 400 + 300));
    expect(calculateWpm(words, 60)).toBe(150);
  });

  it("returns 0 for empty input or zero duration", () => {
    expect(calculateWpm([], 60)).toBe(0);
    expect(calculateWpm([word("hi", 0, 100)], 0)).toBe(0);
  });
});

describe("scorePace", () => {
  it("scores 100 and labels 'ideal' inside the target range", () => {
    const result = scorePace(140);
    expect(result.score).toBe(100);
    expect(result.label).toBe("ideal");
  });

  it("labels and penalizes speaking too slowly", () => {
    const result = scorePace(60);
    expect(result.label).toBe("too slow");
    expect(result.score).toBeLessThan(100);
  });

  it("labels and penalizes speaking too fast", () => {
    const result = scorePace(220);
    expect(result.label).toBe("too fast");
    expect(result.score).toBeLessThan(100);
  });

  it("scores 0 wpm as 0", () => {
    expect(scorePace(0).score).toBe(0);
  });
});

describe("detectFillerWords", () => {
  it("detects single-word fillers", () => {
    const words = [word("So", 0, 200), word("um", 200, 400), word("I", 400, 600), word("think", 600, 800)];
    const fillers = detectFillerWords(words);
    expect(fillers).toEqual([{ word: "um", timestampMs: 200 }]);
  });

  it("detects two-word filler phrases without double-counting", () => {
    const words = [
      word("It's", 0, 200),
      word("you", 200, 400),
      word("know", 400, 600),
      word("great", 600, 800),
    ];
    const fillers = detectFillerWords(words);
    expect(fillers).toEqual([{ word: "you know", timestampMs: 200 }]);
  });

  it("strips punctuation before matching", () => {
    const words = [word("Um,", 0, 200), word("well.", 200, 400)];
    expect(detectFillerWords(words)).toEqual([{ word: "um", timestampMs: 0 }]);
  });

  it("returns an empty array for clean speech", () => {
    const words = [word("This", 0, 200), word("is", 200, 400), word("clean", 400, 600)];
    expect(detectFillerWords(words)).toEqual([]);
  });
});

describe("analyzePauses", () => {
  it("ignores small gaps below the natural-pause threshold", () => {
    const words = [word("a", 0, 200), word("b", 250, 450)]; // 50ms gap
    const result = analyzePauses(words);
    expect(result.pauseCount).toBe(0);
  });

  it("classifies a 500ms gap as natural", () => {
    const words = [word("a", 0, 200), word("b", 700, 900)];
    const result = analyzePauses(words);
    expect(result.pauses[0].classification).toBe("natural");
  });

  it("classifies a 2000ms gap as long", () => {
    const words = [word("a", 0, 200), word("b", 2200, 2400)];
    const result = analyzePauses(words);
    expect(result.pauses[0].classification).toBe("long");
    expect(result.longPauseCount).toBe(1);
  });

  it("classifies a 4000ms gap as awkward", () => {
    const words = [word("a", 0, 200), word("b", 4200, 4400)];
    const result = analyzePauses(words);
    expect(result.pauses[0].classification).toBe("awkward");
  });

  it("scores lower as the proportion of long/awkward pauses increases", () => {
    const allNatural = analyzePauses([
      word("a", 0, 200),
      word("b", 700, 900),
      word("c", 1400, 1600),
    ]);
    const allAwkward = analyzePauses([
      word("a", 0, 200),
      word("b", 4200, 4400),
      word("c", 8400, 8600),
    ]);
    expect(allNatural.score).toBeGreaterThan(allAwkward.score);
  });
});

describe("computeVocalVarietyScore", () => {
  it("scores a genuinely flat voice lower than a varied one", () => {
    const monotonePitch = Array.from({ length: 20 }, (_, i) => ({ atMs: i * 150, value: 150 }));
    const variedPitch = Array.from({ length: 20 }, (_, i) => ({
      atMs: i * 150,
      value: 150 + Math.sin(i) * 40,
    }));
    const flatVolume = Array.from({ length: 20 }, (_, i) => ({ atMs: i * 150, value: 0.5 }));

    const monotone = computeVocalVarietyScore(monotonePitch, flatVolume);
    const varied = computeVocalVarietyScore(variedPitch, flatVolume);

    expect(varied.score).toBeGreaterThan(monotone.score);
  });

  it("handles empty sample arrays without throwing", () => {
    expect(() => computeVocalVarietyScore([], [])).not.toThrow();
    expect(computeVocalVarietyScore([], []).score).toBe(0);
  });
});

describe("computeClarityScore", () => {
  it("reflects average per-word STT confidence as a 0-100 score", () => {
    const words = [word("a", 0, 100, 0.9), word("b", 100, 200, 0.8)];
    expect(computeClarityScore(words)).toBe(85);
  });

  it("returns 0 for no words", () => {
    expect(computeClarityScore([])).toBe(0);
  });
});

describe("computeConfidenceScore", () => {
  it("produces a score and a non-empty, human-readable explanation", () => {
    const pace = scorePace(140);
    const result = computeConfidenceScore({
      paceScore: pace.score,
      fillerCount: 1,
      wordCount: 100,
      pauseScore: 90,
      vocalVarietyScore: 70,
      pace,
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.explanation.every((line) => typeof line === "string" && line.length > 0)).toBe(
      true,
    );
  });

  it("scores clean, well-paced, well-paused speech higher than messy speech", () => {
    const goodPace = scorePace(140);
    const good = computeConfidenceScore({
      paceScore: goodPace.score,
      fillerCount: 0,
      wordCount: 100,
      pauseScore: 95,
      vocalVarietyScore: 90,
      pace: goodPace,
    });

    const badPace = scorePace(240);
    const bad = computeConfidenceScore({
      paceScore: badPace.score,
      fillerCount: 12,
      wordCount: 100,
      pauseScore: 20,
      vocalVarietyScore: 20,
      pace: badPace,
    });

    expect(good.score).toBeGreaterThan(bad.score);
  });
});

describe("computeOverallScore", () => {
  it("weights the four component scores into one composite", () => {
    const score = computeOverallScore({
      confidenceScore: 80,
      clarityScore: 80,
      paceScore: 80,
      vocalVarietyScore: 80,
    });
    expect(score).toBe(80);
  });

  it("is bounded between the min and max of its inputs", () => {
    const score = computeOverallScore({
      confidenceScore: 100,
      clarityScore: 0,
      paceScore: 50,
      vocalVarietyScore: 50,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
