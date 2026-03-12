import { api } from "./client";
import type { CameraStatus } from "@/types";

export const cameraApi = {
  status: () => api.get<CameraStatus>("/camera/status").then((r) => r.data),
  snapshot: () => api.post<{ path: string; url: string }>("/camera/snapshot").then((r) => r.data),
};
