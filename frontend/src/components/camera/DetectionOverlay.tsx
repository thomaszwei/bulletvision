import { useState } from "react";
import type { Detection } from "@/types";

interface DetectionOverlayProps {
  detections: Detection[];
  frameWidth: number;
  frameHeight: number;
  onConfirm: (id: number) => void;
  onReject: (id: number) => void;
  /** Maps detection.id → sequential display number (1-based) */
  indexMap: Record<number, number>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  rejected: "#6B7280",
};

export function DetectionOverlay({
  detections,
  frameWidth,
  frameHeight,
  onConfirm,
  onReject,
  indexMap,
}: DetectionOverlayProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${frameWidth} ${frameHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {detections.map((d) => {
        const px = d.x * frameWidth;
        const py = d.y * frameHeight;
        const pr = d.radius * Math.min(frameWidth, frameHeight);
        const color = STATUS_COLORS[d.status] ?? STATUS_COLORS.pending;
        const isHov = hovered === d.id;
        const isPending = d.status === "pending";
        const num = indexMap[d.id] ?? "?";

        return (
          <g
            key={d.id}
            onMouseEnter={() => setHovered(d.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: isPending ? "pointer" : "default" }}
          >
            {/* Glow ring (pending only) */}
            {isPending && (
              <circle
                cx={px} cy={py}
                r={pr + 8}
                fill="none"
                stroke={color}
                strokeWidth={1}
                strokeOpacity={0.3}
                className="animate-ping-slow"
              />
            )}

            {/* Main ring */}
            <circle
              cx={px} cy={py}
              r={pr + 4}
              fill="none"
              stroke={color}
              strokeWidth={isHov ? 2.5 : 2}
              strokeOpacity={d.status === "rejected" ? 0.4 : 0.9}
            />

            {/* Number badge — centered inside the ring so it's always within the viewport */}
            <circle
              cx={px} cy={py}
              r={Math.min(Math.max(pr * 0.55, 10), 16)}
              fill={color}
              fillOpacity={0.92}
            />
            <text
              x={px} y={py + 4}
              textAnchor="middle"
              fontSize={Math.min(Math.max(pr * 0.45, 9), 13)}
              fill="#0F0F1A"
              fontFamily="Inter, sans-serif"
              fontWeight={700}
            >
              {num}
            </text>

            {/* Confidence badge — shown on hover */}
            {isHov && (
              <>
                <rect
                  x={px + pr + 6} y={py - 10}
                  width={44} height={18}
                  rx={4}
                  fill="#0F0F1A"
                  fillOpacity={0.85}
                />
                <text
                  x={px + pr + 28} y={py + 2}
                  textAnchor="middle"
                  fontSize={10}
                  fill={color}
                  fontFamily="Inter, sans-serif"
                  fontWeight={600}
                >
                  {Math.round(d.confidence * 100)}%
                </text>
              </>
            )}

            {/* Confirm / Reject buttons (hover, pending only) */}
            {isPending && isHov && (
              <>
                {/* Confirm */}
                <g onClick={() => onConfirm(d.id)}>
                  <rect x={px - 30} y={py + pr + 6} width={28} height={20} rx={4} fill="#10B981" />
                  <text x={px - 16} y={py + pr + 20} textAnchor="middle" fontSize={10} fill="white" fontFamily="Inter">✓</text>
                </g>
                {/* Reject */}
                <g onClick={() => onReject(d.id)}>
                  <rect x={px + 2} y={py + pr + 6} width={28} height={20} rx={4} fill="#EF4444" />
                  <text x={px + 16} y={py + pr + 20} textAnchor="middle" fontSize={10} fill="white" fontFamily="Inter">✕</text>
                </g>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
