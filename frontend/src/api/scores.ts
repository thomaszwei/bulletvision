import { api } from "./client";
import type { HighscoreEntry, Score } from "@/types";

export const scoresApi = {
  list: (params?: { session_id?: number; player_id?: number }) =>
    api.get<Score[]>("/scores", { params }).then((r) => r.data),
  highscores: (limit = 20) =>
    api.get<HighscoreEntry[]>("/scores/highscores", { params: { limit } }).then((r) => r.data),
};
