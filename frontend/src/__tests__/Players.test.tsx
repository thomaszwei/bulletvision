/**
 * Unit tests – Players page
 *
 * Covers:
 *  - Page renders with "Add Player" button
 *  - Modal opens when button is clicked
 *  - Save is disabled while name is empty
 *  - Save is enabled once name is typed
 *  - playersApi.create is called with correct payload
 *  - API detail error is shown in modal
 *  - Generic error is shown when API has no detail
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Players from "@/pages/Players";

// ── i18n mock ─────────────────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const n = opts?.count ?? opts?.id ?? opts?.name ?? "";
      const map: Record<string, string> = {
        "players.title": "Players",
        "players.registered": `${n} registered`,
        "players.addPlayer": "Add Player",
        "players.noPlayers": "No players yet",
        "players.noPlayersHint": "Add your first player!",
        "players.newPlayer": "New Player",
        "players.editPlayer": "Edit Player",
        "players.nameLabel": "Name",
        "players.namePlaceholder": "Player name",
        "players.avatarColorLabel": "Avatar Color",
        "players.saveError": "Failed to save. Please try again.",
        "players.deleteConfirm": `Delete ${n}?`,
        "players.scoreLabel": "Score",
        "players.shotsLabel": "Shots",
        "players.accLabel": "Acc.",
        "common.save": "Save",
        "common.saving": "Saving…",
        "common.cancel": "Cancel",
        "common.playerPrefix": `Player #${n}`,
      };
      return map[key] ?? key;
    },
    i18n: { language: "en", resolvedLanguage: "en", changeLanguage: vi.fn() },
  }),
}));

// ── API mock ───────────────────────────────────────────────────────────────────
vi.mock("@/api/players", () => ({
  playersApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 1, name: "Alice", avatar_color: "#EF4444" }),
    update: vi.fn().mockResolvedValue({ id: 1, name: "Updated", avatar_color: "#EF4444" }),
    delete: vi.fn().mockResolvedValue({}),
    stats: vi.fn().mockResolvedValue({ total_score: 0, shots_confirmed: 0, accuracy: 0 }),
  },
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("Players page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the page title and Add Player button", async () => {
    wrap(<Players />);
    expect(await screen.findByText("Add Player")).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
  });

  it("opens the create modal when Add Player is clicked", async () => {
    wrap(<Players />);
    await userEvent.click(await screen.findByText("Add Player"));
    expect(screen.getByText("New Player")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Player name")).toBeInTheDocument();
  });

  it("Save button is disabled while name field is empty", async () => {
    wrap(<Players />);
    await userEvent.click(await screen.findByText("Add Player"));
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Save button becomes enabled once a name is typed", async () => {
    wrap(<Players />);
    await userEvent.click(await screen.findByText("Add Player"));
    await userEvent.type(screen.getByPlaceholderText("Player name"), "Alice");
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("calls playersApi.create with the entered name on submit", async () => {
    const { playersApi } = await import("@/api/players");
    wrap(<Players />);
    await userEvent.click(await screen.findByText("Add Player"));
    await userEvent.type(screen.getByPlaceholderText("Player name"), "Alice");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(playersApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Alice" }),
      ),
    );
  });

  it("shows specific API error detail when create returns 400", async () => {
    const { playersApi } = await import("@/api/players");
    vi.mocked(playersApi.create).mockRejectedValueOnce({
      response: { data: { detail: "Player 'Alice' already exists" } },
    });
    wrap(<Players />);
    await userEvent.click(await screen.findByText("Add Player"));
    await userEvent.type(screen.getByPlaceholderText("Player name"), "Alice");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Player 'Alice' already exists")).toBeInTheDocument();
  });

  it("shows generic error when API returns no detail", async () => {
    const { playersApi } = await import("@/api/players");
    vi.mocked(playersApi.create).mockRejectedValueOnce(new Error("Network error"));
    wrap(<Players />);
    await userEvent.click(await screen.findByText("Add Player"));
    await userEvent.type(screen.getByPlaceholderText("Player name"), "Alice");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Failed to save. Please try again.")).toBeInTheDocument();
  });
});
