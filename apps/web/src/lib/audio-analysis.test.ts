import { describe, it, expect } from "vitest";
import { computeRms, detectPitch } from "./audio-analysis";

function sineWave(frequencyHz: number, sampleRate: number, length: number, amplitude = 0.8): Float32Array {
  const buffer = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = amplitude * Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate);
  }
  return buffer;
}

describe("computeRms", () => {
  it("is 0 for silence", () => {
    expect(computeRms(new Float32Array(512))).toBe(0);
  });

  it("matches the analytic RMS of a sine wave (amplitude / sqrt(2))", () => {
    const buffer = sineWave(200, 16000, 4096, 0.8);
    expect(computeRms(buffer)).toBeCloseTo(0.8 / Math.sqrt(2), 1);
  });
});

describe("detectPitch", () => {
  it("returns 0 for silence", () => {
    expect(detectPitch(new Float32Array(2048), 16000)).toBe(0);
  });

  it("recovers the fundamental frequency of a 150Hz tone within a few Hz", () => {
    const sampleRate = 16000;
    const buffer = sineWave(150, sampleRate, 2048);
    const detected = detectPitch(buffer, sampleRate);
    expect(detected).toBeGreaterThan(0);
    expect(detected).toBeCloseTo(150, 0);
  });

  it("recovers the fundamental frequency of a 220Hz tone within a few Hz", () => {
    const sampleRate = 16000;
    const buffer = sineWave(220, sampleRate, 2048);
    const detected = detectPitch(buffer, sampleRate);
    expect(detected).toBeGreaterThan(0);
    expect(Math.abs(detected - 220)).toBeLessThan(5);
  });

  it("rejects frequencies outside the human voice range", () => {
    const sampleRate = 16000;
    // 30Hz is below the voice floor — should be rejected even though it's a clean tone.
    const buffer = sineWave(30, sampleRate, 4096, 0.8);
    expect(detectPitch(buffer, sampleRate)).toBe(0);
  });
});
