/**
 * Speech Library: curated communication techniques, each with a structured
 * breakdown and a concrete example. Static content in code (same pattern
 * as achievements.ts/shop-items.ts) — no DB table needed since there's no
 * per-user interactivity yet (just reference material to read before or
 * between practice sessions).
 */

export interface SpeechTechnique {
  slug: string;
  name: string;
  category: "Structure" | "Persuasion" | "Clarity" | "Delivery" | "Storytelling";
  /** One-sentence hook shown on the library grid. */
  summary: string;
  whenToUse: string;
  steps: string[];
  example: string;
  practiceTip: string;
}

export const SPEECH_TECHNIQUES: SpeechTechnique[] = [
  {
    slug: "prep",
    name: "PREP",
    category: "Structure",
    summary: "A four-step structure for answering a question clearly and persuasively on the spot.",
    whenToUse:
      "Use it for impromptu questions, interview answers, or any time you need to make one point convincingly in under a minute.",
    steps: [
      "Point — state your main idea in one clear sentence.",
      "Reason — explain why you believe it.",
      "Example — back it up with a specific example, story, or piece of evidence.",
      "Point — restate your main idea to close the loop.",
    ],
    example:
      "\"I think remote work makes teams more focused. (Point) Without constant office interruptions, people get longer stretches of deep work. (Reason) At my last job, our output on quiet Fridays was consistently higher than on days full of meetings. (Example) That's why I'd bet on remote-first teams over open-office ones. (Point)\"",
    practiceTip: "Next impromptu session, silently label each sentence P-R-E-P as you speak — it keeps you from rambling past the point.",
  },
  {
    slug: "rule-of-three",
    name: "The Rule of Three",
    category: "Structure",
    summary: "Groups of three are more memorable and more satisfying to listen to than any other number.",
    whenToUse: "Use it whenever you're listing reasons, examples, or steps — three feels complete, four feels like a list.",
    steps: [
      "Pick your single strongest idea and find two supporting ideas of similar weight.",
      "Order them so the strongest lands last — the ear remembers what it hears most recently.",
      "Phrase all three in a similar grammatical rhythm so they sound like a set, not a list.",
    ],
    example:
      "\"Good feedback is specific, timely, and kind.\" Three parallel adjectives — remove or add a fourth and it stops sounding like a rule and starts sounding like a list.",
    practiceTip: "Before your next session, force yourself to cut any list of reasons down to exactly three.",
  },
  {
    slug: "monroes-motivated-sequence",
    name: "Monroe's Motivated Sequence",
    category: "Persuasion",
    summary: "A five-step persuasive structure built to move an audience from noticing a problem to taking action.",
    whenToUse: "Use it for persuasive speeches where you want the audience to actually do something afterward, not just agree with you.",
    steps: [
      "Attention — open with something that makes the audience actually listen.",
      "Need — establish the problem and why it matters to them specifically.",
      "Satisfaction — present your solution and explain how it solves the problem.",
      "Visualization — paint a picture of life with the problem solved (or unsolved, if you want urgency).",
      "Action — tell them exactly what to do next.",
    ],
    example:
      "A pitch for a recycling program: hook with a surprising waste statistic (Attention), show what it costs the neighborhood (Need), present the program (Satisfaction), describe a cleaner street six months from now (Visualization), and ask them to sign up today (Action).",
    practiceTip: "Try structuring your next persuasive prompt around these five beats instead of jumping straight to your solution.",
  },
  {
    slug: "star-method",
    name: "STAR Method",
    category: "Structure",
    summary: "A structure for answering \"tell me about a time\" questions with a complete, concrete story.",
    whenToUse: "Use it for interview questions and any prompt asking you to describe a specific experience.",
    steps: [
      "Situation — set the scene: where, when, who was involved.",
      "Task — what were you actually responsible for?",
      "Action — what did you specifically do, step by step?",
      "Result — what happened, ideally with a concrete outcome.",
    ],
    example:
      "\"Our team was behind on a launch (Situation). I was responsible for the integration testing (Task). I split the test suite across three people and ran the risky ones first (Action). We shipped two days early with zero critical bugs (Result).\"",
    practiceTip: "When a prompt starts with \"describe a time...\" or \"tell a story about...\", silently map your answer to S-T-A-R before you start talking.",
  },
  {
    slug: "power-pause",
    name: "The Power Pause",
    category: "Delivery",
    summary: "A deliberate silence right after your most important sentence, used to let it land.",
    whenToUse: "Use it immediately after your single most important point — right before a transition, or at the very end of your speech.",
    steps: [
      "Deliver your key sentence with normal pace and energy — don't slow down to signal it's important.",
      "Stop completely for one to two full seconds. Resist the urge to fill it.",
      "Hold eye contact (or, if remote, hold your position) instead of looking away during the pause.",
      "Continue at your normal pace — don't restart quietly or apologetically.",
    ],
    example:
      "\"...and that's the moment I realized I'd been asking the wrong question the whole time.\" [pause] \"So here's what I did instead.\"",
    practiceTip: "In your next session, pick one sentence in advance that you'll pause after, and consciously count \"one-one-thousand, two-one-thousand\" in your head before continuing.",
  },
  {
    slug: "signposting",
    name: "Signposting",
    category: "Clarity",
    summary: "Verbal markers that tell your audience where they are in your speech, like road signs on a highway.",
    whenToUse: "Use it in any speech longer than a minute or two, especially ones with multiple distinct sections or points.",
    steps: [
      "Preview the structure up front: \"I want to cover three things today...\"",
      "Mark transitions explicitly: \"That brings me to my second point...\"",
      "Number your points out loud if there are more than two: \"First... second... finally...\"",
      "Signal the ending clearly: \"So, to bring this together...\"",
    ],
    example:
      "\"I'll cover what happened, why it happened, and what we're doing about it. First, what happened...\" — the audience now has a map before you've said anything substantive.",
    practiceTip: "Add one explicit \"first / second / finally\" to your next multi-point answer, even if it feels over-obvious while you're saying it.",
  },
  {
    slug: "storytelling-arc",
    name: "The Storytelling Arc",
    category: "Storytelling",
    summary: "The setup-conflict-resolution shape that makes a story satisfying instead of just a sequence of events.",
    whenToUse: "Use it for any prompt asking you to tell a story, describe an experience, or illustrate a point with a personal anecdote.",
    steps: [
      "Setup — establish who, where, and what the normal situation was, briefly.",
      "Conflict — introduce the problem, tension, or turning point that broke the normal situation.",
      "Resolution — show how it was resolved, and what changed as a result.",
      "Meaning — in one closing sentence, say what the story actually illustrates.",
    ],
    example:
      "\"I used to plan every minute of a trip (Setup). Then one flight got cancelled and the whole itinerary fell apart (Conflict). I ended up wandering into a market I'd never have planned to visit, and it was the best day of the trip (Resolution). Now I always leave one day unplanned (Meaning).\"",
    practiceTip: "When a prompt asks for a story, spend your first three seconds silently identifying the conflict — if you can't name one, the story needs a sharper turning point.",
  },
  {
    slug: "ethos-pathos-logos",
    name: "Ethos, Pathos, Logos",
    category: "Persuasion",
    summary: "Aristotle's three modes of persuasion: credibility, emotion, and logic — most strong arguments use all three.",
    whenToUse: "Use it to check whether a persuasive point is one-dimensional — an argument that's all logic and no emotion often fails to move people, and vice versa.",
    steps: [
      "Ethos — establish why you're credible to speak on this (experience, evidence, honesty about limits).",
      "Pathos — connect to something the audience actually feels, not just thinks.",
      "Logos — give them a clear, logical reason that holds up under questioning.",
      "Layer them — a single sentence can often carry more than one at once.",
    ],
    example:
      "\"I've coached a hundred speakers through this exact fear (Ethos). I know how it feels to freeze mid-sentence in front of a room (Pathos). And the data is clear: structured practice cuts that freeze rate in half (Logos).\"",
    practiceTip: "After your next persuasive attempt, check which of the three you used — most people default to only one, usually logos.",
  },
  {
    slug: "so-what-test",
    name: "The \"So What\" Test",
    category: "Clarity",
    summary: "A gut-check that forces you to state why your audience should actually care about your point.",
    whenToUse: "Use it while preparing any point that feels informative but not yet compelling — facts alone rarely move people.",
    steps: [
      "State your point plainly.",
      "Ask yourself \"so what?\" as if a skeptical listener said it out loud.",
      "Answer that question in one sentence, connecting the point to something the audience already cares about.",
      "Fold that answer into how you actually deliver the point.",
    ],
    example:
      "\"Our servers are 30% faster now.\" So what? \"...which means your reports load before your coffee's done brewing.\" The second version survives the test; the first doesn't.",
    practiceTip: "Pick the least interesting fact in your next speech and force it through this test before you say it out loud.",
  },
  {
    slug: "contrast-antithesis",
    name: "Contrast (Antithesis)",
    category: "Persuasion",
    summary: "Pairing two opposing ideas in the same sentence to make your point sharper and more memorable.",
    whenToUse: "Use it when you want a single sentence to be quotable, or when you're making a values-based argument.",
    steps: [
      "Identify the idea you're arguing for.",
      "Identify its natural opposite.",
      "Put both in one sentence with parallel grammar: \"not X, but Y\" or \"X isn't about A, it's about B.\"",
      "Save it for your most important sentence — using this on every line dilutes it.",
    ],
    example:
      "\"This isn't about working harder. It's about working on the right things.\" The contrast does more work than either half would alone.",
    practiceTip: "Write one contrast sentence for your main point before your next session, even if you don't end up using it verbatim.",
  },
  {
    slug: "feynman-technique",
    name: "The Feynman Technique",
    category: "Clarity",
    summary: "A method for explaining anything simply by forcing yourself to remove jargon, one pass at a time.",
    whenToUse: "Use it whenever a prompt asks you to explain something complex to someone with no background in it.",
    steps: [
      "Explain the idea as if to a smart twelve-year-old — no jargon allowed.",
      "Notice every place you reached for a technical term or got stuck.",
      "Go back and replace each one with a plain-language explanation or a concrete analogy.",
      "Repeat until you can go all the way through without hitting a wall.",
    ],
    example:
      "Instead of \"the algorithm has logarithmic time complexity,\" try \"every time the input doubles, it only takes one extra step to solve — like finding a name in a phone book by always splitting it in half.\"",
    practiceTip: "In your next explanatory prompt, ban yourself from using any word you couldn't define to a stranger on the spot.",
  },
  {
    slug: "primacy-recency",
    name: "Primacy and Recency",
    category: "Structure",
    summary: "People remember the beginning and end of a speech far better than the middle — plan those two moments deliberately.",
    whenToUse: "Use it when deciding where to place your strongest material — never bury your best point in the middle.",
    steps: [
      "Identify your single strongest point or story.",
      "Put a version of it in your opening — as a hook, not the full reveal.",
      "Put your second-strongest point at the very end, as your closing thought.",
      "Let the middle carry supporting material — it's the part people remember least.",
    ],
    example:
      "Open a speech about resilience with a one-line teaser of your hardest moment, save the full story's resolution for the close, and use the middle for the supporting reasoning.",
    practiceTip: "Before your next session, decide your opening line and closing line first — write the middle last.",
  },
  {
    slug: "rhetorical-questions",
    name: "Rhetorical Questions",
    category: "Delivery",
    summary: "Questions you ask the audience without expecting an answer, used to make them think instead of just listen.",
    whenToUse: "Use them sparingly to open a section, create a moment of reflection, or reframe a point as something the audience discovers themselves.",
    steps: [
      "Ask a question you already plan to answer yourself in the next sentence or two.",
      "Pause briefly after asking it — let it actually register as a question, not just a stylistic tic.",
      "Answer it clearly rather than leaving it hanging.",
      "Use no more than one or two per speech — overuse turns it into a verbal habit instead of a device.",
    ],
    example:
      "\"So why does this keep happening? [brief pause] Because we're solving the symptom, not the cause.\"",
    practiceTip: "Try opening just one section of your next speech with a genuine rhetorical question instead of a flat statement.",
  },
  {
    slug: "callback",
    name: "The Callback",
    category: "Storytelling",
    summary: "Referencing something from earlier in your speech again near the end, which makes the whole thing feel intentional.",
    whenToUse: "Use it in your closing to tie a speech together, especially after telling a story or making a joke early on.",
    steps: [
      "Plant a specific, memorable detail, phrase, or story early in your speech.",
      "Develop your speech normally, without mentioning it again.",
      "Near your close, reference that same detail — the same words if possible.",
      "Let the callback do double duty: it should land as both a conclusion and a small surprise.",
    ],
    example:
      "Open with \"my grandmother always said the second cup of coffee is the honest one.\" Close, after making your point, with \"...and that's why I trust the second cup, and the second draft, more than the first.\"",
    practiceTip: "Pick one small detail from your prompt's opening and deliberately bring it back in your final sentence.",
  },
] as const;

export function getTechniqueBySlug(slug: string): SpeechTechnique | undefined {
  return SPEECH_TECHNIQUES.find((t) => t.slug === slug);
}
