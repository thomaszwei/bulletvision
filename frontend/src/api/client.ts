import axios from "axios";

// In both dev and prod, the browser always uses relative /api paths.
// Dev: Vite proxy forwards /api → http://backend:8000
// Prod: nginx forwards /api → backend:8000
export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
});

// Stream URL (MJPEG) — always relative so it works in both environments
export const streamUrl = (): string => "/api/camera/stream";
