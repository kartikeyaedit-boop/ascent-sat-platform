"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
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
import { useSpeechSession } from "@/hooks/use-speech-session";
import { getRandomImpromptuPrompt } from "@/lib/speech-prompts";

export default function PracticePage() {
  const [prompt, setPrompt] = useState(getRandomImpromptuPrompt);
  const session = useSpeechSession("impromptu", prompt);

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
