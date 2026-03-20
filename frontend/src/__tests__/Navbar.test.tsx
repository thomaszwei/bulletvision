/**
 * Unit tests – Navbar (language switcher)
 *
 * Covers:
 *  - Language toggle button is always visible in the header
 *  - Button label shows the alternative language (DE when EN is active)
 *  - Clicking the button calls i18n.changeLanguage with the other language
 *  - Works correctly when browser language is a regional variant (e.g. "de-DE")
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Navbar } from "@/components/layout/Navbar";

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockChangeLanguage = vi.fn();

// We reassign language between tests via this object
const mockI18n = {
  language: "en",
  resolvedLanguage: "en",
  changeLanguage: mockChangeLanguage,
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        "camera.statusOk": `Camera OK · ${opts?.fps ?? 0} fps`,
        "camera.statusOffline": "Camera Offline",
        "camera.demo": " · Demo",
      };
      return map[key] ?? key;
    },
    i18n: mockI18n,
  }),
}));

vi.mock("@/api/camera", () => ({
  cameraApi: {
    status: vi.fn().mockResolvedValue({
      available: true,
      fps: 30,
      demo_mode: false,
      backend: "AUTO",
      width: 640,
      height: 480,
      focus_supported: true,
      focus_mode: "CONTINUOUS",
      focus_requested_mode: "CONTINUOUS",
    }),
  },
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Navbar – language switcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = "en";
    mockI18n.resolvedLanguage = "en";
  });

  it("renders the language toggle button", () => {
    wrap(<Navbar />);
    // When English is active the button offers to switch to German
    expect(screen.getByRole("button", { name: /DE/i })).toBeInTheDocument();
  });

  it("renders a logo link to the dashboard", () => {
    wrap(<Navbar />);
    expect(screen.getByRole("link", { name: /Go to dashboard/i })).toHaveAttribute("href", "/");
  });

  it("calls changeLanguage('de') when active language is English", async () => {
    wrap(<Navbar />);
    await userEvent.click(screen.getByRole("button", { name: /DE/i }));
    expect(mockChangeLanguage).toHaveBeenCalledWith("de");
  });

  it("shows EN button and calls changeLanguage('en') when German is active", async () => {
    mockI18n.language = "de";
    mockI18n.resolvedLanguage = "de";
    wrap(<Navbar />);
    const btn = screen.getByRole("button", { name: /EN/i });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(mockChangeLanguage).toHaveBeenCalledWith("en");
  });

  it("handles regional locale 'de-DE' correctly – shows EN button", () => {
    mockI18n.language = "de-DE";
    mockI18n.resolvedLanguage = "de-DE";
    wrap(<Navbar />);
    // startsWith("de") must match "de-DE" → button should show EN
    expect(screen.getByRole("button", { name: /EN/i })).toBeInTheDocument();
  });
});
