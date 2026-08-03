import { redirect } from "next/navigation";
import { Users, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth-server";
import { getAdminStats, listAllUsersWithStats } from "@/server/admin/admin.service";
import { AdminUserList } from "@/components/admin/admin-user-list";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [stats, users] = await Promise.all([getAdminStats(), listAllUsersWithStats()]);

  const serializedUsers = users.map((u) => ({
    ...u,
    lastSessionAt: u.lastSessionAt ? u.lastSessionAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">All registered users and platform activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <CardTitle className="text-2xl tabular-nums">{stats.totalUsers}</CardTitle>
              <p className="text-sm text-muted-foreground">Total users</p>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Activity className="size-5" />
            </div>
            <div>
              <CardTitle className="text-2xl tabular-nums">{stats.activeUsers}</CardTitle>
              <p className="text-sm text-muted-foreground">Active in last 7 days</p>
            </div>
          </CardHeader>
        </Card>
      </div>

      <AdminUserList initialUsers={serializedUsers} />
    </div>
  );
}
