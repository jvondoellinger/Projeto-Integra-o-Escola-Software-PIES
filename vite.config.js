import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig(({ mode }) => ({
  resolve: {
    alias:
      mode === "pages"
        ? [
            {
              find: "./store.mjs",
              replacement: resolve("src/gestao/pagesStore.js"),
            },
          ]
        : [],
  },
  server: { proxy: { "/api": { target: "http://127.0.0.1:4173" } } },
  build: {
    outDir: mode === "pages" ? "dist-pages" : "dist",
    rollupOptions: {
      input: {
        legacy: resolve("index.html"),
        management: resolve("gestao.html"),
      },
    },
  },
}));
