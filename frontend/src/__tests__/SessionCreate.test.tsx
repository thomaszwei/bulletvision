/**
 * Unit tests – Session creation (SessionPicker)
 *
 * Covers:
 *  - Create session form renders (name input, mode dropdown, Create button)
 *  - Mode dropdown contains all three options
 *  - Create button is always enabled (name is optional)
 *  - sessionsApi.create is called with correct payload on submit
 *  - After creation the app navigates to /session/:id
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import LiveSession from "@/pages/LiveSession";

// ── i18n mock ──────────────────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        "session.title": "Live Session",
        "session.createNew": "Create New Session",
        "session.resumeActive": "Resume Active Session",
        "session.sessionNameLabel": "Session Name (optional)",
        "session.sessionNamePlaceholder": "e.g. Saturday Match",
        "session.modeLabel": "Mode",
        "session.playersLabel": "Players",
        "session.noPlayersYet": "No players yet.",
        "session.createSome": "Create some.",
        "session.createButton": "Create & Open Session",
        "session.creating": "Creating…",
        "session.modeFreeplay": "Freeplay",
        "session.modeTurnbased": "Turn-Based",
        "session.modeTimed": "Timed Rounds",
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
    create: vi.fn().mockResolvedValue({ id: 42, name: "Test", mode: "freeplay", status: "active" }),
    get: vi.fn().mockResolvedValue({ id: 42, name: "Test", mode: "freeplay", status: "active", players: [] }),
    end: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/api/players", () => ({
  playersApi: {
    list: vi.fn().mockResolvedValue([]),
    stats: vi.fn().mockResolvedValue({ total_score: 0, shots_confirmed: 0, accuracy: 0 }),
  },
}));

// ── Render helper ──────────────────────────────────────────────────────────────
function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/session"]}>
        <Routes>
          <Route path="/session" element={<LiveSession />} />
          <Route path="/session/:id" element={<div data-testid="session-view">Session View</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Session creation (SessionPicker)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the session name input and Create button", async () => {
    wrap();
    expect(await screen.findByPlaceholderText("e.g. Saturday Match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create & Open Session/i })).toBeInTheDocument();
  });

  it("mode dropdown contains all three session modes", async () => {
    wrap();
    await screen.findByPlaceholderText("e.g. Saturday Match");
    expect(screen.getByRole("option", { name: "Freeplay" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Turn-Based" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Timed Rounds" })).toBeInTheDocument();
  });

  it("Create button is enabled even with no session name (name is optional)", async () => {
    wrap();
    await screen.findByPlaceholderText("e.g. Saturday Match");
    expect(screen.getByRole("button", { name: /Create & Open Session/i })).not.toBeDisabled();
  });

  it("calls sessionsApi.create when Create button is clicked", async () => {
    const { sessionsApi } = await import("@/api/sessions");
    wrap();
    await screen.findByPlaceholderText("e.g. Saturday Match");
    await userEvent.type(screen.getByPlaceholderText("e.g. Saturday Match"), "Weekend Match");
    await userEvent.click(screen.getByRole("button", { name: /Create & Open Session/i }));
    await waitFor(() =>
      expect(sessionsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Weekend Match", mode: "freeplay" }),
      ),
    );
  });

  it("navigates to /session/:id after successful creation", async () => {
    wrap();
    await screen.findByPlaceholderText("e.g. Saturday Match");
    await userEvent.click(screen.getByRole("button", { name: /Create & Open Session/i }));
    // After navigation the stub route renders
    expect(await screen.findByTestId("session-view")).toBeInTheDocument();
  });
});
