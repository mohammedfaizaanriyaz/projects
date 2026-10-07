import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production" && env.VITE_API_URL) {
    throw new Error("Production uses the same origin for UI and API. Remove VITE_API_URL before building.");
  }
  return {
    plugins: [react()],
    server: { proxy: { "/api": env.DEV_BACKEND_URL || "http://127.0.0.1:5000" } },
  };
});
