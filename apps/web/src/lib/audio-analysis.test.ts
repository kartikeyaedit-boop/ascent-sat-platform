import { describe, it, expect } from "vitest";
import { computeRms, detectPitch, computeSpectralClarity } from "./audio-analysis";

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

describe("computeSpectralClarity", () => {
  const sampleRate = 16000;
  const fftSize = 2048;
  const binCount = fftSize / 2; // matches AnalyserNode.frequencyBinCount
  const binHz = sampleRate / fftSize;

  it("returns 0 for true silence (no measurable energy at all)", () => {
    const silence = new Float32Array(binCount).fill(-Infinity);
    expect(computeSpectralClarity(silence, sampleRate, fftSize)).toBe(0);
  });

  it("returns close to 1 when energy is concentrated in the 2-8kHz presence band", () => {
    const data = new Float32Array(binCount).fill(-1000);
    for (let i = 0; i < binCount; i++) {
      const hz = i * binHz;
      if (hz >= 2000 && hz <= 8000) data[i] = 0; // full power in-band
    }
    expect(computeSpectralClarity(data, sampleRate, fftSize)).toBeCloseTo(1, 2);
  });

  it("returns close to 0 when energy is concentrated below the presence band", () => {
    const data = new Float32Array(binCount).fill(-1000);
    for (let i = 0; i < binCount; i++) {
      const hz = i * binHz;
      if (hz >= 300 && hz < 2000) data[i] = 0; // full power, but below the band
    }
    expect(computeSpectralClarity(data, sampleRate, fftSize)).toBeCloseTo(0, 2);
  });

  it("matches the exact bin-count ratio for uniform energy across the full speech band", () => {
    const data = new Float32Array(binCount).fill(-1000);
    let fullBandBins = 0;
    let presenceBandBins = 0;
    for (let i = 0; i < binCount; i++) {
      const hz = i * binHz;
      if (hz >= 300 && hz <= 8000) {
        data[i] = 0; // uniform power across the whole speech band
        fullBandBins++;
        if (hz >= 2000) presenceBandBins++;
      }
    }
    const expectedRatio = presenceBandBins / fullBandBins;
    expect(computeSpectralClarity(data, sampleRate, fftSize)).toBeCloseTo(expectedRatio, 5);
  });
});
