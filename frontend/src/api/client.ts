import axios from "axios";

// In production, everything goes through nginx at the same origin.
// In dev, Vite proxy handles /api → backend:8000.
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

export const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Stream URL (MJPEG) — used directly as <img src>
export const streamUrl = (): string => {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  return `${base}/api/camera/stream`;
};
