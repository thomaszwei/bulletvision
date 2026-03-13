import { api } from "./client";
import type { Session, Detection } from "@/types";

export const sessionsApi = {
  list: () => api.get<Session[]>("/sessions").then((r) => r.data),
  get: (id: number) => api.get<Session>(`/sessions/${id}`).then((r) => r.data),
  create: (body: { name?: string; mode?: string; player_ids?: number[]; notes?: string }) =>
    api.post<Session>("/sessions", body).then((r) => r.data),
  update: (id: number, body: Partial<Pick<Session, "name" | "notes" | "status">>) =>
    api.put<Session>(`/sessions/${id}`, body).then((r) => r.data),
  delete: (id: number) => api.delete(`/sessions/${id}`),
  start: (id: number) => api.post<Session>(`/sessions/${id}/start`).then((r) => r.data),
  captureBaseline: (id: number) =>
    api.post<{ baseline_path: string }>(`/sessions/${id}/baseline`).then((r) => r.data),
  resetBaseline: (id: number) =>
    api.post<{ baseline_path: string }>(`/sessions/${id}/reset-baseline`).then((r) => r.data),
  end: (id: number) => api.post<Session>(`/sessions/${id}/end`).then((r) => r.data),
  nextPlayer: (id: number) => api.post(`/sessions/${id}/next-player`).then((r) => r.data),
  switchToPlayer: (id: number, playerId: number) =>
    api.post(`/sessions/${id}/switch-player`, { player_id: playerId }).then((r) => r.data),
  getDetections: (id: number, status?: string) =>
    api
      .get<Detection[]>(`/sessions/${id}/detections`, { params: status ? { status } : {} })
      .then((r) => r.data),
};
