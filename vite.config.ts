import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@app": path.resolve(__dirname, "./src/app"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@styles": path.resolve(__dirname, "./src/styles"),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'miqwad-frontend.onrender.com' // رابط موقعك على ريندر
    ],
    proxy: {
      // TEMPORARY (dev only): bypasses the backend's missing CORS headers.
      // Remove once the backend enables CORS for the dev origin.
      // See BACKEND_API_REQUIREMENTS.md → CORS gap.
      "/api": {
        target: "https://miqwad-test.runasp.net",
        changeOrigin: true,
        secure: false,
      },
      // `/phone/login` lives outside the `/api` prefix on the backend
      // (confirmed in Swagger) — proxy it separately so the dev origin
      // stays same-origin like every other auth call.
      "/phone": {
        target: "https://miqwad-test.runasp.net",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
