/**
 * Unit tests – Dashboard page
 *
 * Covers:
 *  - Page renders without crashing (catches "X is not defined" regressions)
 *  - Stat card titles are shown
 *  - "New Session" button links to /session
 *  - Empty-state text is shown when there are no sessions
 *  - Session rows are rendered when data is present
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Dashboard from "@/pages/Dashboard";

// ── i18n mock ──────────────────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        "dashboard.title": "Dashboard",
        "dashboard.subtitle": "Raspberry Pi Bullet Detection System",
        "dashboard.newSession": "New Session",
        "dashboard.cameraLabel": "Camera",
        "dashboard.online": "Online",
        "dashboard.offline": "Offline",
        "dashboard.demoMode": "Demo mode",
        "dashboard.fps": `${opts?.fps ?? 0} fps`,
        "dashboard.activeSessions": "Active Sessions",
        "dashboard.currentlyRunning": "Currently running",
        "dashboard.totalSessions": "Total Sessions",
        "dashboard.allTime": "All time",
        "dashboard.topScore": "Top Score",
        "dashboard.recentSessions": "Recent Sessions",
        "dashboard.noSessions": "No sessions yet.",
        "dashboard.startOne": "Start one.",
        "dashboard.topPlayers": "Top Players",
        "dashboard.noScores": "No scores yet.",
        "dashboard.fullLeaderboard": "Full leaderboard →",
        "common.pts": "pts",
        "common.sessionPrefix": `Session #${opts?.id ?? ""}`,
      };
      return map[key] ?? key;
    },
    i18n: { language: "en", resolvedLanguage: "en", changeLanguage: vi.fn() },
  }),
}));

// ── API mocks ──────────────────────────────────────────────────────────────────
vi.mock("@/api/sessions", () => ({
  sessionsApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/api/scores", () => ({
  scoresApi: {
    highscores: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("@/api/camera", () => ({
  cameraApi: {
    status: vi.fn().mockResolvedValue({ available: true, fps: 30, demo_mode: false }),
  },
}));
vi.mock("@/api/system", () => ({
  systemApi: {
    stats: vi.fn().mockResolvedValue({
      cpu_percent: 12.5,
      memory_percent: 45.0,
      memory_used_mb: 921.6,
      memory_total_mb: 2048.0,
      cpu_temp_celsius: 52.3,
      disk_percent: 33.0,
      disk_used_gb: 5.28,
      disk_total_gb: 16.0,
      camera_fps: 5.0,
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

describe("Dashboard page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders without crashing (no undefined components)", () => {
    // If StatCard or StatusBadge are undefined this throws synchronously
    expect(() => wrap(<Dashboard />)).not.toThrow();
  });

  it("shows the Dashboard heading", async () => {
    wrap(<Dashboard />);
    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
  });

  it("shows all four stat card labels", async () => {
    wrap(<Dashboard />);
    expect(await screen.findByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("Active Sessions")).toBeInTheDocument();
    expect(screen.getByText("Total Sessions")).toBeInTheDocument();
    expect(screen.getByText("Top Score")).toBeInTheDocument();
  });

  it("shows 'New Session' link pointing to /session", async () => {
    wrap(<Dashboard />);
    const link = await screen.findByRole("link", { name: /New Session/i });
    expect(link).toHaveAttribute("href", "/session");
  });

  it("shows empty-state text when there are no sessions", async () => {
    wrap(<Dashboard />);
    expect(await screen.findByText("No sessions yet.")).toBeInTheDocument();
  });

  it("renders a session row when sessions are returned", async () => {
    const { sessionsApi } = await import("@/api/sessions");
    vi.mocked(sessionsApi.list).mockResolvedValue([
      { id: 7, name: "Weekend Match", status: "ended", mode: "freeplay", created_at: "2026-03-12T10:00:00Z" } as never,
    ]);
    wrap(<Dashboard />);
    expect(await screen.findByText("Weekend Match")).toBeInTheDocument();
  });
});
