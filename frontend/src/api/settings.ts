import { api } from "./client";

export const settingsApi = {
  list: () => api.get<Record<string, string | number | boolean>>("/settings").then((r) => r.data),
  bulkUpdate: (settings: Record<string, string | number | boolean>) =>
    api.put<Record<string, string | number | boolean>>("/settings", { settings }).then((r) => r.data),
};
