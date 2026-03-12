/**
 * Unit tests – Settings page
 *
 * Covers:
 *  - Setting groups (Detection / Camera / Scoring) are rendered
 *  - Range sliders are present for numeric settings
 *  - Toggle buttons are present for boolean settings
 *  - Values loaded from the API are reflected in the controls
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect } from "vitest";
import Settings from "@/pages/Settings";

// ── i18n mock ─────────────────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { returnObjects?: boolean }) => {
      // Settings fields need to return an object when returnObjects is set
      if (opts?.returnObjects && key.startsWith("settings.fields.")) {
        const field = key.replace("settings.fields.", "");
        const labels: Record<string, { label: string; desc: string }> = {
          detection_confidence_threshold: { label: "Confidence Threshold", desc: "Min confidence (0–1)" },
          detection_min_area: { label: "Min Area", desc: "Smallest hole area" },
          detection_max_area: { label: "Max Area", desc: "Largest hole area" },
          detection_circularity: { label: "Circularity", desc: "Circularity score" },
          detection_darkness_threshold: { label: "Darkness Threshold", desc: "Max pixel value" },
          detection_alignment_enabled: { label: "Frame Alignment", desc: "Align frames" },
          detection_fps: { label: "Detection FPS", desc: "FPS for analysis" },
          camera_width: { label: "Frame Width", desc: "Capture width" },
          camera_height: { label: "Frame Height", desc: "Capture height" },
          points_per_hole: { label: "Points per Hole", desc: "Base points" },
          zone_scoring_enabled: { label: "Zone Scoring", desc: "Multiplier for centre hits" },
        };
        return (labels[field] ?? { label: field, desc: "" }) as unknown as string;
      }
      const map: Record<string, string> = {
        "settings.title": "Settings",
        "settings.subtitle": "Detection, camera and scoring parameters",
        "settings.saving": "Saving…",
        "settings.saveError": "Failed to save settings.",
        "common.save": "Save",
        "common.cancel": "Cancel",
      };
      return map[key] ?? key;
    },
    i18n: { language: "en", resolvedLanguage: "en", changeLanguage: vi.fn() },
  }),
}));

// ── API mock – returns realistic default values ────────────────────────────────
vi.mock("@/api/settings", () => ({
  settingsApi: {
    list: vi.fn().mockResolvedValue({
      detection_confidence_threshold: 0.55,
      detection_min_area: 25,
      detection_max_area: 1500,
      detection_circularity: 0.35,
      detection_darkness_threshold: 120,
      detection_alignment_enabled: false,
      detection_fps: 3,
      camera_width: 640,
      camera_height: 480,
      points_per_hole: 10,
      zone_scoring_enabled: false,
    }),
    bulkUpdate: vi.fn().mockResolvedValue({}),
  },
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Settings page", () => {
  it("renders the page title", async () => {
    wrap(<Settings />);
    expect(await screen.findByText("Settings")).toBeInTheDocument();
  });

  it("renders all three setting group headers", async () => {
    wrap(<Settings />);
    // Groups are hardcoded in SETTING_METAS and rendered verbatim
    expect(await screen.findByText("Detection")).toBeInTheDocument();
    expect(screen.getByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Scoring")).toBeInTheDocument();
  });

  it("renders range sliders for numeric settings", async () => {
    wrap(<Settings />);
    await screen.findByText("Detection"); // wait for load
    const sliders = screen.getAllByRole("slider");
    // 9 numeric settings = 9 sliders (the 2 booleans get toggle buttons)
    expect(sliders.length).toBe(9);
  });

  it("renders toggle buttons for boolean settings", async () => {
    wrap(<Settings />);
    await screen.findByText("Detection");
    // Labels for the two boolean fields come from the mock
    expect(screen.getByText("Frame Alignment")).toBeInTheDocument();
    expect(screen.getByText("Zone Scoring")).toBeInTheDocument();
  });

  it("shows the correct loaded value for detection_fps slider", async () => {
    wrap(<Settings />);
    await screen.findByText("Detection FPS");
    const allSliders = screen.getAllByRole("slider") as HTMLInputElement[];
    // detection_fps: min=1, max=10, step=1, value=3
    const fpsSlider = allSliders.find((s) => s.min === "1" && s.max === "10" && s.step === "1");
    expect(fpsSlider).toBeDefined();
    expect(fpsSlider!.value).toBe("3");
  });
});
