import { useQuery } from "@tanstack/react-query";
import { cameraApi } from "@/api/camera";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { data: camStatus } = useQuery({
    queryKey: ["camera-status"],
    queryFn: cameraApi.status,
    refetchInterval: 10_000,
  });

  const toggleLang = () => {
    // resolvedLanguage handles "de-DE" → "de" matching
    const current = i18n.resolvedLanguage ?? i18n.language;
    i18n.changeLanguage(current.startsWith("de") ? "en" : "de");
  };

  const isDE = (i18n.resolvedLanguage ?? i18n.language).startsWith("de");
  const statusDetails = `backend=${camStatus?.backend ?? "unknown"} focus=${camStatus?.focus_mode ?? "unknown"}`;

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-surface-border bg-surface-card shrink-0">
      {/* Mobile title */}
      <Link to="/" aria-label="Go to dashboard" className="md:hidden font-bold text-sm hover:text-brand transition-colors">
        BulletVision
      </Link>
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {/* Camera status */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
            camStatus?.available
              ? "bg-confirm/10 text-confirm"
              : "bg-accent/10 text-accent"
          )}
          title={statusDetails}
        >
          {camStatus?.available ? <Wifi size={12} /> : <WifiOff size={12} />}
          {camStatus?.available
            ? t("camera.statusOk", { fps: camStatus.fps })
            : t("camera.statusOffline")}
          {camStatus?.demo_mode && t("camera.demo")}
        </div>

        {/* Language switcher */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-surface-border bg-surface-elevated hover:bg-brand/20 hover:border-brand hover:text-white text-gray-300 transition-colors"
          title={isDE ? "Switch to English" : "Zu Deutsch wechseln"}
        >
          {isDE ? "🇬🇧 EN" : "🇩🇪 DE"}
        </button>
      </div>
    </header>
  );
}
