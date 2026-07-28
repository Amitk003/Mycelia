import { defineConfig } from "vite";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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
    include: ["simple-peer"],
    exclude: ["mycelia-core"],
  },
  plugins: [
    nodePolyfills(),
  ],
});
