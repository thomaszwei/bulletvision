import { useRef, useState } from "react";
import { streamUrl } from "@/api/client";
import type { Detection } from "@/types";
import { DetectionOverlay } from "./DetectionOverlay";
import { cn } from "@/lib/utils";

interface LiveFeedProps {
  detections: Detection[];
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  hasBaseline: boolean;
}

export function LiveFeed({ detections, onConfirm, onReject, hasBaseline }: LiveFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden bg-black border border-surface-border"
      style={{ aspectRatio: "4/3" }}
    >
      {/* MJPEG stream — native browser support, no JS decoding needed */}
      <img
        src={streamUrl()}
        alt="Live camera feed"
        className="w-full h-full object-contain"
        onLoad={(e) => {
          const img = e.currentTarget;
          setImgSize({ w: img.naturalWidth || img.clientWidth, h: img.naturalHeight || img.clientHeight });
        }}
      />

      {/* SVG overlay for detection markers */}
      {imgSize && (
        <DetectionOverlay
          detections={detections}
          frameWidth={imgSize.w}
          frameHeight={imgSize.h}
          onConfirm={onConfirm}
          onReject={onReject}
        />
      )}

      {/* Baseline indicator badge */}
      {hasBaseline && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-surface-card/80 backdrop-blur-sm text-confirm text-xs font-semibold px-2.5 py-1 rounded-full border border-confirm/30">
          <span className="w-1.5 h-1.5 rounded-full bg-confirm animate-pulse" />
          Baseline Active
        </div>
      )}

      {!hasBaseline && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <p className="text-gray-300 font-medium mb-1">No Baseline Captured</p>
            <p className="text-gray-500 text-sm">Press &ldquo;Capture Baseline&rdquo; to start detecting</p>
          </div>
        </div>
      )}
    </div>
  );
}
