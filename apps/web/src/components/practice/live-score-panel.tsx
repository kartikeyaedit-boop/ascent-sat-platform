"use client";

import { Gauge, MessageSquareWarning, Timer } from "lucide-react";

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-lg font-bold leading-none tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function LiveScorePanel({
  wpm,
  fillerCount,
  elapsedSeconds,
}: {
  wpm: number;
  fillerCount: number;
  elapsedSeconds: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatTile icon={Gauge} label="Pace (wpm)" value={wpm > 0 ? String(wpm) : "—"} />
      <StatTile icon={MessageSquareWarning} label="Filler words" value={String(fillerCount)} />
      <StatTile
        icon={Timer}
        label="Elapsed"
        value={`${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60).toString().padStart(2, "0")}`}
      />
    </div>
  );
}
