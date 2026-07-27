import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/sc-datav/",
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://119.96.30.33:8096",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
