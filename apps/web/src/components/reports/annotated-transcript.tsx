function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

/**
 * Highlights filler words in the transcript using the session's already-
 * computed fillerWords list (word + timestamp) as the source of truth,
 * rather than re-detecting — one source of truth, matching the same
 * bigram-first walk used to detect them in src/lib/speech-metrics.ts.
 */
export function AnnotatedTranscript({
  transcript,
  fillerWords,
}: {
  transcript: string;
  fillerWords: { word: string }[];
}) {
  const words = transcript.split(/\s+/).filter(Boolean);
  const singleFillers = new Set(
    fillerWords.filter((f) => !f.word.includes(" ")).map((f) => f.word),
  );
  const multiFillers = new Set(fillerWords.filter((f) => f.word.includes(" ")).map((f) => f.word));

  const nodes: { text: string; isFiller: boolean }[] = [];
  let i = 0;
  while (i < words.length) {
    const current = normalizeWord(words[i]);
    const next = words[i + 1] ? normalizeWord(words[i + 1]) : "";
    const bigram = `${current} ${next}`;

    if (next && multiFillers.has(bigram)) {
      nodes.push({ text: `${words[i]} ${words[i + 1]}`, isFiller: true });
      i += 2;
      continue;
    }
    if (singleFillers.has(current)) {
      nodes.push({ text: words[i], isFiller: true });
    } else {
      nodes.push({ text: words[i], isFiller: false });
    }
    i += 1;
  }

  return (
    <p className="text-sm leading-relaxed text-pretty">
      {nodes.map((node, idx) => (
        <span key={idx}>
          {node.isFiller ? (
            <mark className="rounded bg-amber-500/20 px-0.5 text-amber-700 dark:text-amber-400">
              {node.text}
            </mark>
          ) : (
            node.text
          )}
          {idx < nodes.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
