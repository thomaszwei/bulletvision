import { useQuery } from "@tanstack/react-query";
import { cameraApi } from "@/api/camera";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { data: camStatus } = useQuery({
    queryKey: ["camera-status"],
    queryFn: cameraApi.status,
    refetchInterval: 10_000,
  });

  const toggleLang = () =>
    i18n.changeLanguage(i18n.language === "de" ? "en" : "de");

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-surface-border bg-surface-card shrink-0">
      {/* Mobile title */}
      <span className="md:hidden font-bold text-sm">BulletVision</span>
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
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-elevated hover:bg-surface-border text-gray-400 hover:text-white transition-colors"
          title={i18n.language === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
        >
          {i18n.language === "de" ? "🇬🇧 EN" : "🇩🇪 DE"}
        </button>
      </div>
    </header>
  );
}
