// -----------------------------------------------------------------------------
// vite.config.ts — the build tool config for the web app
// -----------------------------------------------------------------------------
// The "proxy" below is the clever bit: during development the web app runs on
// port 5173 while the server runs on port 4000. When the browser asks for
// /api/... Vite silently forwards that request to the server, so our frontend
// code can just use "/api/..." without worrying about the server's address.
// -----------------------------------------------------------------------------

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // Forward any request starting with /api to the backend server.
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});