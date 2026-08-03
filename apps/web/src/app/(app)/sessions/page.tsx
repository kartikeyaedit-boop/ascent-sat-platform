import Link from "next/link";
import { Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth-server";
import { listSessionsForUser } from "@/server/speech/session.service";

const MODE_LABELS: Record<string, string> = {
  impromptu: "Impromptu speaking",
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function scoreColorClass(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { sessions, totalPages, total } = await listSessionsForUser(user.id, page);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your sessions</h1>
          <p className="text-muted-foreground">
            {total === 0 ? "No sessions yet." : `${total} session${total === 1 ? "" : "s"} recorded.`}
          </p>
        </div>
        <Button asChild>
          <Link href="/practice">
            <Mic className="size-4" />
            Practice
          </Link>
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mic className="size-6" />
            </div>
            <p className="font-medium">No sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Your practice sessions will show up here once you record your first one.
            </p>
            <Button asChild className="mt-2">
              <Link href="/practice">Start practicing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {MODE_LABELS[session.mode] ?? session.mode}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {session.promptText ?? "No prompt"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(session.createdAt).toLocaleString()} ·{" "}
                      {formatDuration(session.durationSeconds)} · {Math.round(session.wpm)} wpm
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-2xl font-bold tabular-nums ${scoreColorClass(session.overallScore)}`}>
                      {session.overallScore}
                    </p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link href={`/sessions?page=${page - 1}`}>
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            ) : (
              <span>
                <ChevronLeft className="size-4" />
                Previous
              </span>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            {page < totalPages ? (
              <Link href={`/sessions?page=${page + 1}`}>
                Next
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <span>
                Next
                <ChevronRight className="size-4" />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
