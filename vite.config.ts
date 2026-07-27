import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    outDir: "dist",
  },
  server: {
    port: 3000,
    open: true,
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@mycelia/hypha-core", "@mycelia/sensor-field", "@mycelia/evolution"],
  },
});
