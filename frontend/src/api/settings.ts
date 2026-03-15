import { api } from "./client";

export const settingsApi = {
  list: () => api.get<Record<string, string | number | boolean>>("/settings").then((r) => r.data),
  // Backend expects values as JSON-encoded strings (e.g. "3", "true", "0.55")
  bulkUpdate: (settings: Record<string, string | number | boolean>) =>
    api.put<Record<string, string | number | boolean>>("/settings", {
      settings: Object.fromEntries(
        Object.entries(settings).map(([k, v]) => [k, JSON.stringify(v)])
      ),
    }).then((r) => r.data),
};
