import {
  BookOpenText,
  History,
  LayoutDashboard,
  Medal,
  Mic,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Practice", href: "/practice", icon: Mic, enabled: true },
  { label: "Sessions", href: "/sessions", icon: History, enabled: true },
  { label: "Speech Library", href: "/library", icon: BookOpenText, enabled: true },
  { label: "Achievements", href: "/achievements", icon: Medal, enabled: true },
  { label: "Store", href: "/store", icon: ShoppingBag, enabled: true },
];
