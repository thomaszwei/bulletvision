import { create } from "zustand";
import type { Detection } from "@/types";

interface DetectionState {
  detections: Detection[];
  setDetections: (d: Detection[]) => void;
  addOrUpdate: (d: Detection) => void;
}

export const useDetectionStore = create<DetectionState>((set) => ({
  detections: [],
  setDetections: (detections) => set({ detections }),
  addOrUpdate: (d) =>
    set((state) => {
      const idx = state.detections.findIndex((x) => x.id === d.id);
      if (idx >= 0) {
        const updated = [...state.detections];
        updated[idx] = d;
        return { detections: updated };
      }
      return { detections: [d, ...state.detections] };
    }),
}));
