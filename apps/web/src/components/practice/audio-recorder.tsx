"use client";

import { Mic, Square, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { SpeechSessionStatus } from "@/hooks/use-speech-session";

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const STATUS_LABEL: Record<SpeechSessionStatus, string> = {
  idle: "Ready when you are",
  "requesting-permission": "Requesting microphone access…",
  connecting: "Connecting…",
  recording: "Recording",
  submitting: "Scoring your speech…",
  error: "Something went wrong",
};

export function AudioRecorder({
  status,
  elapsedSeconds,
  onStart,
  onStop,
}: {
  status: SpeechSessionStatus;
  elapsedSeconds: number;
  onStart: () => void;
  onStop: () => void;
}) {
  const isRecording = status === "recording";
  const isBusy = status === "requesting-permission" || status === "connecting" || status === "submitting";

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative">
        {isRecording && (
          <motion.span
            className="absolute inset-0 rounded-full bg-red-500/30"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <Button
          type="button"
          size="icon"
          onClick={isRecording ? onStop : onStart}
          disabled={isBusy}
          className={`relative size-20 rounded-full ${
            isRecording ? "bg-red-500 hover:bg-red-600" : ""
          }`}
        >
          {isBusy ? (
            <Loader2 className="size-7 animate-spin" />
          ) : isRecording ? (
            <Square className="size-6 fill-current" />
          ) : (
            <Mic className="size-7" />
          )}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-2xl font-mono font-semibold tabular-nums">
          {formatElapsed(elapsedSeconds)}
        </p>
        <p className="text-sm text-muted-foreground">{STATUS_LABEL[status]}</p>
      </div>
    </div>
  );
}
