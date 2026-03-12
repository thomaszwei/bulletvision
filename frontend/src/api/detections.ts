import { api } from "./client";
import type { Detection } from "@/types";

export const detectionsApi = {
  get: (id: number) => api.get<Detection>(`/detections/${id}`).then((r) => r.data),
  confirm: (id: number) => api.put<Detection>(`/detections/${id}/confirm`).then((r) => r.data),
  reject: (id: number) => api.put<Detection>(`/detections/${id}/reject`).then((r) => r.data),
  adjust: (id: number, body: { x: number; y: number; radius: number }) =>
    api.put<Detection>(`/detections/${id}/adjust`, body).then((r) => r.data),
};
