import {
  Footprints,
  Flame,
  Award,
  Trophy,
  Star,
  Sparkles,
  TrendingUp,
  Gem,
  Zap,
  CalendarCheck,
  Rocket,
  Gauge,
  AudioLines,
  Radio,
  Crown,
  Timer,
  Medal,
  type LucideIcon,
} from "lucide-react";

/**
 * Achievement icons are stored as name strings in the DB/static catalog
 * (see achievements.ts) so they can be JSON-serialized across the
 * server/client boundary — this maps those names back to components.
 * Falls back to Medal for any name not in the map.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Award,
  Trophy,
  Star,
  Sparkles,
  TrendingUp,
  Gem,
  Zap,
  CalendarCheck,
  Rocket,
  Gauge,
  AudioLines,
  Radio,
  Crown,
  Timer,
  Medal,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Medal;
}
