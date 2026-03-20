/**
 * Unit tests - Sidebar logo and nav
 *
 * Covers:
 *  - Sidebar logo links back to dashboard (/)
 *  - Active nav styling highlights current route
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "nav.dashboard": "Dashboard",
        "nav.liveSession": "Live Session",
        "nav.players": "Players",
        "nav.highscores": "Highscores",
        "nav.history": "History",
        "nav.calibration": "Calibration",
        "nav.settings": "Settings",
        "nav.help": "Help",
      };
      return map[key] ?? key;
    },
    i18n: { language: "en", resolvedLanguage: "en", changeLanguage: vi.fn() },
  }),
}));

describe("Sidebar", () => {
  it("renders logo link to dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/players"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Go to dashboard/i })).toHaveAttribute("href", "/");
  });

  it("marks Players nav item active on /players route", () => {
    render(
      <MemoryRouter initialEntries={["/players"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    const playersLink = screen.getByRole("link", { name: "Players" });
    expect(playersLink.className).toContain("bg-brand/15");
  });
});
