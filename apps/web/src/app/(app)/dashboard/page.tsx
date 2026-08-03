import Link from "next/link";
import { ArrowRight, Mic } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listSessionsForUser } from "@/server/speech/session.service";

const MODE_LABELS: Record<string, string> = {
  impromptu: "Impromptu speaking",
};

function scoreColorClass(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const recentSessions = user
    ? (await listSessionsForUser(user.id, 1)).sessions.slice(0, 3)
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Ready to practice? Every session gives you real, explained feedback.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mic className="size-6" />
          </div>
          <CardTitle className="mt-2">Start a practice session</CardTitle>
          <CardDescription>
            Pick a mode, get a prompt, and start speaking — you&apos;ll see
            live feedback as you go and a full report when you&apos;re done.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/practice">Start practicing</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent sessions</CardTitle>
            {recentSessions.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sessions">
                  View all
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </div>
          {recentSessions.length === 0 && (
            <CardDescription>
              Your practice sessions will show up here once you record your
              first one.
            </CardDescription>
          )}
        </CardHeader>
        {recentSessions.length > 0 && (
          <CardContent className="space-y-2">
            {recentSessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {MODE_LABELS[session.mode] ?? session.mode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-lg font-bold tabular-nums ${scoreColorClass(session.overallScore)}`}
                >
                  {session.overallScore}
                </p>
              </Link>
            ))}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>More is on the way</CardTitle>
          <CardDescription>
            A full analytics dashboard and more practice modes are being
            built next.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Account created:{" "}
          {user ? new Date(user.createdAt).toLocaleDateString() : "—"}
        </CardContent>
      </Card>
    </div>
  );
}
