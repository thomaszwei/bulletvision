import { Link, useLocation } from "react-router-dom";
import {
  Crosshair,
  LayoutDashboard,
  Users,
  Trophy,
  History,
  Settings,
  HelpCircle,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/session", icon: Crosshair, label: "Live Session" },
  { to: "/players", icon: Users, label: "Players" },
  { to: "/highscores", icon: Trophy, label: "Highscores" },
  { to: "/history", icon: History, label: "History" },
  { to: "/calibration", icon: Sliders, label: "Calibration" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/help", icon: HelpCircle, label: "Help" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-surface-card border-r border-surface-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <Crosshair size={18} />
        </div>
        <span className="font-bold text-base tracking-tight">BulletVision</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand/15 text-brand"
                  : "text-gray-400 hover:text-white hover:bg-surface-elevated"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-surface-border">
        <p className="text-xs text-gray-600">BulletVision v1.0</p>
      </div>
    </aside>
  );
}
