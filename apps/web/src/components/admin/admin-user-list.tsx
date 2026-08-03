"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coins, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminUsers, useAdjustCoins } from "@/hooks/use-admin";
import { ApiClientError } from "@/types/api";
import type { AdminUserListItem } from "@/services/admin";

function CoinControls({ user }: { user: AdminUserListItem }) {
  const [amount, setAmount] = useState("10");
  const adjust = useAdjustCoins();

  function parsedAmount(): number | null {
    const n = Math.trunc(Number(amount));
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  function handleAdjust(sign: 1 | -1) {
    const n = parsedAmount();
    if (n === null) {
      toast.error("Enter a positive amount first.");
      return;
    }
    adjust.mutate(
      { userId: user.id, delta: sign * n },
      {
        onSuccess: () => toast.success(`${sign > 0 ? "Gave" : "Took"} ${n} coins ${sign > 0 ? "to" : "from"} ${user.name}.`),
        onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Couldn't adjust coins."),
      },
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="h-8 w-20"
      />
      <Button size="sm" variant="outline" disabled={adjust.isPending} onClick={() => handleAdjust(1)}>
        Give
      </Button>
      <Button size="sm" variant="outline" disabled={adjust.isPending} onClick={() => handleAdjust(-1)}>
        Take
      </Button>
    </div>
  );
}

export function AdminUserList({ initialUsers }: { initialUsers: AdminUserListItem[] }) {
  const { data: users } = useAdminUsers(initialUsers);

  return (
    <div className="space-y-3">
      {(users ?? initialUsers).map((user) => (
        <Card key={user.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{user.name}</p>
                {user.role === "ADMIN" && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    <Shield className="size-3" />
                    Admin
                  </span>
                )}
                {!user.emailVerified && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Unverified
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {user.totalSessions} session{user.totalSessions === 1 ? "" : "s"} · {user.currentStreak}-day streak ·{" "}
                {user.xp} XP ·{" "}
                {user.lastSessionAt
                  ? `last active ${new Date(user.lastSessionAt).toLocaleDateString()}`
                  : "never practiced"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-600">
                <Coins className="size-4" />
                {user.coins}
              </div>
              <CoinControls user={user} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
