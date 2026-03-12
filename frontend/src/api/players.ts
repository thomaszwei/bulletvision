import { api } from "./client";
import type { Player, PlayerStats } from "@/types";

export const playersApi = {
  list: () => api.get<Player[]>("/players").then((r) => r.data),
  get: (id: number) => api.get<Player>(`/players/${id}`).then((r) => r.data),
  create: (body: { name: string; avatar_color?: string }) =>
    api.post<Player>("/players", body).then((r) => r.data),
  update: (id: number, body: { name?: string; avatar_color?: string }) =>
    api.put<Player>(`/players/${id}`, body).then((r) => r.data),
  delete: (id: number) => api.delete(`/players/${id}`),
  stats: (id: number) => api.get<PlayerStats>(`/players/${id}/stats`).then((r) => r.data),
};
