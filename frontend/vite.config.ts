import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // In dev mode, proxy API calls to the backend container.
      // BACKEND_URL is a server-side env var (no VITE_ prefix) so it
      // never gets embedded in the browser bundle.
      "/api": {
        target: process.env.BACKEND_URL || "http://backend:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: process.env.BACKEND_URL || "http://backend:8000",
        changeOrigin: true,
        ws: true,
      },
      "/snapshots": {
        target: process.env.BACKEND_URL || "http://backend:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-toast",
            "@radix-ui/react-tabs",
          ],
        },
      },
    },
  },
});
