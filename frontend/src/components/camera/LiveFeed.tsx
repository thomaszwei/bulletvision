import { useRef, useState } from "react";
import { streamUrl } from "@/api/client";
import type { Detection } from "@/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface LiveFeedProps {
  detections: Detection[];
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  hasBaseline: boolean;
  indexMap: Record<number, number>;
}

export function LiveFeed({ detections, onConfirm, onReject, hasBaseline, indexMap }: LiveFeedProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full rounded-xl overflow-hidden bg-black border border-surface-border")}
      style={{ aspectRatio: "4/3" }}
    >
      <img
        src={streamUrl()}
        alt="Live camera feed"
        className="w-full h-full object-contain"
        onLoad={(e) => {
          const img = e.currentTarget;
          setImgSize({ w: img.naturalWidth || img.clientWidth, h: img.naturalHeight || img.clientHeight });
        }}
      />

      {imgSize && (
        <DetectionOverlay
          detections={detections}
          frameWidth={imgSize.w}
          frameHeight={imgSize.h}
          onConfirm={onConfirm}
          onReject={onReject}
          indexMap={indexMap}
        />
      )}

      {hasBaseline && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-surface-card/80 backdrop-blur-sm text-confirm text-xs font-semibold px-2.5 py-1 rounded-full border border-confirm/30">
          <span className="w-1.5 h-1.5 rounded-full bg-confirm animate-pulse" />
          {t("camera.baselineActive")}
        </div>
      )}

      {!hasBaseline && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <p className="text-gray-300 font-medium mb-1">{t("camera.noBaseline")}</p>
            <p className="text-gray-500 text-sm">{t("camera.noBaselineHint")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
