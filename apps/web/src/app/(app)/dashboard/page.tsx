import { getCurrentUser } from "@/lib/auth-server";
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
          Here&apos;s your study snapshot for today.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>More is on the way</CardTitle>
          <CardDescription>
            You&apos;re logged in and your account is fully set up. XP, streaks,
            achievements, and practice modules are being built next — this
            dashboard will come alive as each phase ships.
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
