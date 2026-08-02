"use client";

import { useEffect, useRef } from "react";

export function LiveTranscript({ transcript }: { transcript: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div
      ref={scrollRef}
      className="h-40 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed"
    >
      {transcript ? (
        <p>{transcript}</p>
      ) : (
        <p className="text-muted-foreground italic">
          Your words will appear here as you speak…
        </p>
      )}
    </div>
  );
}
