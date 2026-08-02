/**
 * Phase 1 ships one practice mode (impromptu speaking) with a curated
 * prompt bank. Phase 2 adds mode-specific prompt sets and AI-generated
 * prompts — this is structured so that's additive, not a rewrite.
 */
export const IMPROMPTU_PROMPTS = [
  "Describe a time you had to make a decision with incomplete information.",
  "What's a skill you'd want to master, and why?",
  "Convince someone to try something you love.",
  "Describe a moment you changed your mind about something important.",
  "What does a good leader do that a bad leader doesn't?",
  "Tell a story about a time you failed at something and what you learned.",
  "If you could give advice to yourself five years ago, what would it be?",
  "Describe a place that means a lot to you and why.",
  "What's a common belief you disagree with?",
  "Explain something complicated to someone who knows nothing about it.",
  "Describe the most interesting person you've met.",
  "What would you do with an unexpected free week?",
  "Make the case for why your favorite hobby is worth trying.",
  "Describe a time you had to adapt quickly to a change.",
  "What's something you believe that most people don't?",
] as const;

export function getRandomImpromptuPrompt(): string {
  return IMPROMPTU_PROMPTS[Math.floor(Math.random() * IMPROMPTU_PROMPTS.length)];
}
