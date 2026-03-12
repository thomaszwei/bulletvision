import { useQuery } from "@tanstack/react-query";
import { cameraApi } from "@/api/camera";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

export function Navbar() {
  const { data: camStatus } = useQuery({
    queryKey: ["camera-status"],
    queryFn: cameraApi.status,
    refetchInterval: 10_000,
  });

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-surface-border bg-surface-card shrink-0">
      {/* Mobile title */}
      <span className="md:hidden font-bold text-sm">BulletVision</span>
      <div className="hidden md:block" />

      {/* Right side: camera status */}
      <div className="flex items-center gap-3">
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
            ? `Camera OK · ${camStatus.fps} fps`
            : "Camera Offline"}
          {camStatus?.demo_mode && " · Demo"}
        </div>
      </div>
    </header>
  );
}
