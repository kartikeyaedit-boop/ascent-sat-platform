import { describe, it, expect } from "vitest";
import { SPEECH_TECHNIQUES, getTechniqueBySlug } from "./speech-techniques";

describe("SPEECH_TECHNIQUES", () => {
  it("has a reasonable number of curated techniques", () => {
    expect(SPEECH_TECHNIQUES.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique slugs", () => {
    const slugs = SPEECH_TECHNIQUES.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every technique a full, non-empty breakdown", () => {
    for (const t of SPEECH_TECHNIQUES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.summary.length).toBeGreaterThan(0);
      expect(t.whenToUse.length).toBeGreaterThan(0);
      expect(t.steps.length).toBeGreaterThan(0);
      expect(t.example.length).toBeGreaterThan(0);
      expect(t.practiceTip.length).toBeGreaterThan(0);
    }
  });
});

describe("getTechniqueBySlug", () => {
  it("finds a technique by its slug", () => {
    const result = getTechniqueBySlug("prep");
    expect(result?.name).toBe("PREP");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getTechniqueBySlug("not-a-real-technique")).toBeUndefined();
  });
});
