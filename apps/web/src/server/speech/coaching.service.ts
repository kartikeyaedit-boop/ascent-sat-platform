/**
 * Rule-based coaching feedback — deliberately not an LLM call. Generates
 * strengths/weaknesses/action plan/drills directly from the already-computed
 * scores (src/lib/speech-metrics.ts), the same way those scores themselves
 * are derived from real measurements rather than a black box. Zero cost,
 * zero API key, zero external dependency, and it can never fail or degrade
 * — every session gets real, explained feedback every time.
 */

export interface CoachingFeedbackContent {
  strengths: string[];
  weaknesses: string[];
  actionPlan: string[];
  practiceDrills: string[];
  motivationalNote: string;
}

interface GenerateCoachingFeedbackInput {
  mode: string;
  promptText?: string | null;
  transcript: string;
  metrics: {
    wpm: number;
    paceLabel: string;
    fillerWordCount: number;
    pauseCount: number;
    longPauseCount: number;
    confidenceScore: number;
    clarityScore: number;
    vocalVarietyScore: number;
    overallScore: number;
  };
}

export function generateCoachingFeedback(
  input: GenerateCoachingFeedbackInput,
): CoachingFeedbackContent {
  const { metrics } = input;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const actionPlan: string[] = [];
  const practiceDrills: string[] = [];

  // --- Pace ---
  if (metrics.paceLabel === "ideal") {
    strengths.push(`Your pace (${Math.round(metrics.wpm)} wpm) was right in the ideal conversational range.`);
  } else if (metrics.paceLabel === "too fast" || metrics.paceLabel === "slightly fast") {
    weaknesses.push(
      `You were speaking ${metrics.paceLabel === "too fast" ? "quite fast" : "a bit fast"} (${Math.round(metrics.wpm)} wpm) — slow down slightly so listeners have time to absorb each point.`,
    );
    actionPlan.push("Consciously add a brief pause after each main point before moving to the next.");
    practiceDrills.push("Read a paragraph aloud at half your normal speed, then work back up gradually — record both takes and compare.");
  } else if (metrics.paceLabel === "too slow" || metrics.paceLabel === "slightly slow") {
    weaknesses.push(
      `You were speaking ${metrics.paceLabel === "too slow" ? "quite slowly" : "a bit slowly"} (${Math.round(metrics.wpm)} wpm) — a touch more energy in your pace will keep listeners engaged.`,
    );
    actionPlan.push("Practice speaking with a bit more forward momentum between sentences.");
    practiceDrills.push("Read a paragraph aloud aiming for 140-150 words per minute, timing yourself with a stopwatch.");
  }

  // --- Filler words ---
  const fillerPer100 = input.transcript.split(/\s+/).length > 0
    ? (metrics.fillerWordCount / input.transcript.split(/\s+/).length) * 100
    : 0;
  if (metrics.fillerWordCount === 0) {
    strengths.push("Your delivery was completely clean — no filler words at all.");
  } else if (fillerPer100 < 2) {
    strengths.push(`You kept filler words to a minimum (only ${metrics.fillerWordCount}).`);
  } else {
    weaknesses.push(
      `Filler words ("um", "like", "you know") showed up ${metrics.fillerWordCount} time${metrics.fillerWordCount === 1 ? "" : "s"} — replacing them with a silent pause will sound more deliberate.`,
    );
    actionPlan.push("Whenever you feel a filler word coming, pause silently instead — it feels longer to you than it does to your listener.");
    practiceDrills.push("Record yourself for 60 seconds on any topic and count every filler word afterward — awareness alone cuts the count fast.");
  }

  // --- Pauses ---
  if (metrics.pauseCount === 0) {
    weaknesses.push("You didn't pause at all — a few deliberate pauses would give your ideas room to land.");
    actionPlan.push("Add a one-second pause after your most important sentence.");
    practiceDrills.push("Practice the 'power pause': deliver one sentence, then silently count to two before continuing.");
  } else if (metrics.longPauseCount === 0) {
    strengths.push("Your pauses felt natural and controlled, not hesitant.");
  } else if (metrics.longPauseCount / metrics.pauseCount > 0.4) {
    weaknesses.push(
      `Several of your pauses (${metrics.longPauseCount} of ${metrics.pauseCount}) ran long enough to feel hesitant rather than deliberate.`,
    );
    actionPlan.push("When you need a moment to think, keep talking with a brief transition phrase instead of going silent for too long.");
  }

  // --- Vocal variety ---
  if (metrics.vocalVarietyScore >= 70) {
    strengths.push("Your voice had good energy and variation, which kept the delivery engaging.");
  } else if (metrics.vocalVarietyScore < 40) {
    weaknesses.push("Your voice stayed fairly flat, which can read as less engaged even when the content is strong.");
    actionPlan.push("Consciously emphasize your key words by varying pitch and volume, not just speaking louder.");
    practiceDrills.push("Read a children's book aloud, exaggerating your pitch changes twice as much as feels natural — it'll sound normal to listeners.");
  }

  // --- Clarity ---
  if (metrics.clarityScore >= 85) {
    strengths.push("Your words came through clearly and were easy to follow.");
  } else if (metrics.clarityScore < 60) {
    weaknesses.push("Some words weren't fully clear — crisper articulation, especially at the ends of words, will help.");
    practiceDrills.push("Practice a tongue twister slowly and deliberately for one minute, focusing on finishing every consonant.");
  }

  // Guarantee every array has at least one entry — always something true to say.
  if (strengths.length === 0) {
    strengths.push("You completed the full exercise, which is genuinely the hardest part of getting better at this.");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Nothing stood out as a weak point in this session — the next challenge is doing it again just as well.");
  }
  if (actionPlan.length === 0) {
    actionPlan.push("Keep practicing regularly — consistency matters more than any single session.");
  }
  if (practiceDrills.length === 0) {
    practiceDrills.push("Try a new practice mode or a tougher prompt next time to keep building.");
  }

  const motivationalNote =
    metrics.overallScore >= 80
      ? "Strong session overall — this is the kind of delivery that lands well with a real audience."
      : metrics.overallScore >= 60
        ? "Solid foundation here. The specific fixes above are small adjustments, not a rebuild."
        : "Every speaker starts somewhere — you showed up and spoke, which is the actual hard part. The rest is just reps.";

  return { strengths, weaknesses, actionPlan, practiceDrills, motivationalNote };
}
