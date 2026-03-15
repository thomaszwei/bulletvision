import { api } from "./client";

export interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  cpu_temp_celsius: number | null;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  camera_fps: number | null;
}

export const systemApi = {
  stats: () => api.get<SystemStats>("/system/stats").then((r) => r.data),
};
