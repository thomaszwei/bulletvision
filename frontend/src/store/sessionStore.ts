import { create } from "zustand";
import type { Session } from "@/types";

interface SessionState {
  activeSession: Session | null;
  setActiveSession: (s: Session | null) => void;
  updateActiveSession: (partial: Partial<Session>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  setActiveSession: (s) => set({ activeSession: s }),
  updateActiveSession: (partial) =>
    set((state) =>
      state.activeSession
        ? { activeSession: { ...state.activeSession, ...partial } }
        : {}
    ),
}));
