"use client";

import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopNav } from "@/components/layout/app-topnav";
import { useAuthStore } from "@/stores/auth-store";
import type { PublicUser } from "@/types/api";

export function AppShell({
  initialUser,
  children,
}: {
  initialUser: PublicUser;
  children: React.ReactNode;
}) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser, setUser]);

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopNav />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
