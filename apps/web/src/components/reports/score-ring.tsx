"use client";

import { motion } from "framer-motion";

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981"; // emerald-500
  if (score >= 60) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

export function ScoreRing({
  score,
  label,
  size = 96,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const strokeWidth = size * 0.09;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="fill-none stroke-muted"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            stroke={scoreColor(clamped)}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
          {clamped}
        </div>
      </div>
      <p className="text-center text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
