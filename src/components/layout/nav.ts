import type { UserRole } from "@/lib/auth";

export type NavItem = {
  href: string;
  labelKey:
    | "nav.dashboard"
    | "nav.greenhouses"
    | "nav.cultures"
    | "nav.parameters"
    | "nav.watering"
    | "nav.tasks"
    | "nav.employees"
    | "nav.reports"
    | "nav.notifications"
    | "nav.ai"
    | "nav.sensorEntry"
    | "nav.users"
    | "nav.db";
  icon: string;
  allowed: UserRole[] | "any";
  badge?: "notifications";
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "nav.dashboard", icon: "🏠", allowed: "any" },
  { href: "/greenhouses", labelKey: "nav.greenhouses", icon: "🏡", allowed: "any" },
  { href: "/cultures", labelKey: "nav.cultures", icon: "🌱", allowed: ["admin", "agronomist", "viewer"] },
  { href: "/parameters", labelKey: "nav.parameters", icon: "📈", allowed: "any", badge: "notifications" },
  { href: "/watering", labelKey: "nav.watering", icon: "💧", allowed: "any" },
  { href: "/tasks", labelKey: "nav.tasks", icon: "✅", allowed: "any" },
  { href: "/employees", labelKey: "nav.employees", icon: "👥", allowed: ["admin", "agronomist", "viewer"] },
  { href: "/reports", labelKey: "nav.reports", icon: "📊", allowed: ["admin", "agronomist", "viewer"] },
  { href: "/notifications", labelKey: "nav.notifications", icon: "🔔", allowed: "any", badge: "notifications" },
  { href: "/ai", labelKey: "nav.ai", icon: "🤖", allowed: ["admin", "agronomist", "viewer"] },
  { href: "/sensor-entry", labelKey: "nav.sensorEntry", icon: "🧪", allowed: ["admin", "operator"] },
  { href: "/users", labelKey: "nav.users", icon: "🛡️", allowed: ["admin"] },
  { href: "/db", labelKey: "nav.db", icon: "🗄️", allowed: ["admin"] },
];

