import Link from "next/link";
import { Mic } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

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
          <CardTitle>More is on the way</CardTitle>
          <CardDescription>
            Session history, the speech library, achievements, and analytics
            are being built next — this dashboard will fill in as each phase
            ships.
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
