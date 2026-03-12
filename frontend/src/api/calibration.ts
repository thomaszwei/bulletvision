import { api } from "./client";
import type { CalibrationProfile } from "@/types";

export const calibrationApi = {
  list: () => api.get<CalibrationProfile[]>("/calibration").then((r) => r.data),
  get: (id: number) => api.get<CalibrationProfile>(`/calibration/${id}`).then((r) => r.data),
  create: (body: { name: string }) =>
    api.post<CalibrationProfile>("/calibration", body).then((r) => r.data),
  update: (id: number, body: { corners_json?: string; perspective_matrix?: string; crop_rect_json?: string }) =>
    api.put<CalibrationProfile>(`/calibration/${id}`, body).then((r) => r.data),
  activate: (id: number) =>
    api.post<CalibrationProfile>(`/calibration/${id}/activate`).then((r) => r.data),
  delete: (id: number) => api.delete(`/calibration/${id}`),
};
