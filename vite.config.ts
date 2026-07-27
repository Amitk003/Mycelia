import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    target: "es2022",
    outDir: "dist",
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: [".", "pkg"],
    },
  },
  worker: {
    format: "es",
  },
  resolve: {
    alias: {
      "@pkg": resolve(__dirname, "./pkg"),
    },
  },
  optimizeDeps: {
    exclude: ["mycelia-core"],
  },
});
