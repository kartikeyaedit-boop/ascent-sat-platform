"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AudioRecorder } from "@/components/practice/audio-recorder";
import { LiveTranscript } from "@/components/practice/live-transcript";
import { LiveScorePanel } from "@/components/practice/live-score-panel";
import { useSpeechSession, isIOS } from "@/hooks/use-speech-session";
import { getRandomImpromptuPrompt } from "@/lib/speech-prompts";

export default function PracticePage() {
  const [prompt, setPrompt] = useState(getRandomImpromptuPrompt);
  const session = useSpeechSession("impromptu", prompt);

  // Checked client-side only, after mount, to avoid an SSR/client render
  // mismatch — navigator isn't available during server rendering.
  const [showIOSWarning, setShowIOSWarning] = useState(false);
  useEffect(() => {
    setShowIOSWarning(isIOS());
  }, []);

  const canChangePrompt = session.status === "idle";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Impromptu speaking</h1>
        <p className="text-muted-foreground">
          Speak for as long as you&apos;d like. You&apos;ll get live feedback
          as you go, and a full report when you&apos;re done.
        </p>
      </div>

      {showIOSWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            iPhone&apos;s Safari has a known reliability issue with live
            speech recognition, especially on a second recording in the
            same visit — you may see the transcript stay empty even
            though pace and tone scoring still work. For the most
            reliable experience, use Chrome on Android or a desktop/
            laptop browser instead.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Your prompt</CardTitle>
              <CardDescription className="mt-1 text-base text-foreground">
                {prompt}
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!canChangePrompt}
              onClick={() => setPrompt(getRandomImpromptuPrompt())}
              title="New prompt"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <AudioRecorder
            status={session.status}
            elapsedSeconds={session.elapsedSeconds}
            onStart={session.start}
            onStop={session.stop}
          />

          {session.errorMessage && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              {session.errorMessage}
            </p>
          )}

          <LiveScorePanel
            wpm={session.liveWpm}
            fillerCount={session.liveFillerCount}
            elapsedSeconds={session.elapsedSeconds}
          />

          <div className="mt-4">
            <LiveTranscript transcript={session.liveTranscript} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
