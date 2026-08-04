"use client";

import { Sparkles } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { NavLinks } from "@/components/layout/nav-links";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/50 md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        {siteConfig.name}
      </div>

      <NavLinks />
    </aside>
  );
}
