"use client";

import Link from "next/link";
import { Coins, Flame, LogOut, Settings, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth-store";
import { useGamificationSummary } from "@/hooks/use-gamification";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppTopNav() {
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const { data: summary } = useGamificationSummary();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <MobileNav />
        <div
          className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-sm font-semibold text-orange-500"
          title={
            summary
              ? `${summary.currentStreak}-day streak (longest: ${summary.longestStreak})`
              : "Streak"
          }
        >
          <Flame className="size-4" />
          <span>{summary?.currentStreak ?? 0}</span>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-600 sm:flex">
          <Coins className="size-4" />
          <span>{summary?.coins ?? 0}</span>
        </div>
        <div
          className="hidden items-center gap-2 sm:flex"
          title={
            summary
              ? `${summary.xpIntoLevel} / ${summary.xpForNextLevel} XP to level ${summary.level + 1}`
              : "XP"
          }
        >
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round((summary?.progress ?? 0) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Level {summary?.level ?? 1}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5">
              <div className="relative">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {user ? getInitials(user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                {summary?.equippedPet && (
                  <span
                    className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background text-[10px] leading-none ring-1 ring-border"
                    title={summary.equippedPet.name}
                  >
                    {summary.equippedPet.emoji}
                  </span>
                )}
              </div>
              <div className="hidden flex-col items-start sm:flex">
                <span className="text-sm font-medium leading-tight">{user?.name}</span>
                {summary?.equippedTitle && (
                  <span className="text-[10px] leading-tight text-primary">{summary.equippedTitle}</span>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserIcon className="size-4" />
              Profile
              <span className="ml-auto text-[10px] text-muted-foreground">
                Soon
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              variant="destructive"
            >
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
