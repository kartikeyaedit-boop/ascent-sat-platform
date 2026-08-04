import { notFound } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreRing } from "@/components/reports/score-ring";
import { AnnotatedTranscript } from "@/components/reports/annotated-transcript";
import { CoachingFeedbackCard } from "@/components/reports/coaching-feedback-card";
import { requireUser } from "@/lib/auth-server";
import { getSessionForUser } from "@/server/speech/session.service";
import type { CoachingFeedbackRecord } from "@/services/speech";

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const session = await getSessionForUser(id, user.id).catch(() => null);
  if (!session) notFound();

  const fillerWords = session.fillerWords as unknown as { word: string; timestampMs: number }[];
  const confidenceExplanation = session.confidenceExplanation as unknown as string[];
  const feedback = session.feedback as unknown as CoachingFeedbackRecord | null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Session report</h1>
          <p className="text-muted-foreground">
            {session.mode === "impromptu" ? "Impromptu speaking" : session.mode} ·{" "}
            {new Date(session.createdAt).toLocaleString()}
          </p>
        </div>
        <Button asChild>
          {/* Plain anchor, not next/link: forces a full page load so a
              fresh recording always starts in a clean JS realm — some
              mobile browsers' SpeechRecognition engine (notably iOS
              WebKit) stops delivering results on a second use within
              the same page lifetime, and only a real reload resets it. */}
          <a href="/practice">
            <Mic className="size-4" />
            Practice again
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <ScoreRing score={session.overallScore} label="Overall" />
            <ScoreRing score={session.confidenceScore} label="Confidence" />
            <ScoreRing score={session.clarityScore} label="Clarity" />
            <ScoreRing score={session.paceScore} label="Pace" />
            <ScoreRing score={session.vocalVarietyScore} label="Vocal variety" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-lg font-bold tabular-nums">{Math.round(session.wpm)}</p>
              <p className="text-xs text-muted-foreground">Words per minute</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-lg font-bold tabular-nums">{fillerWords.length}</p>
              <p className="text-xs text-muted-foreground">Filler words</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-lg font-bold tabular-nums">{session.longPauseCount}</p>
              <p className="text-xs text-muted-foreground">Long pauses</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold">Why this confidence score?</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {confidenceExplanation.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnotatedTranscript transcript={session.transcript} fillerWords={fillerWords} />
        </CardContent>
      </Card>

      <CoachingFeedbackCard feedback={feedback} />
    </div>
  );
}
