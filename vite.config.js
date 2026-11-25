import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig(({ mode }) => ({
  server: { proxy: { "/api": { target: "http://127.0.0.1:4173" } } },
  build: {
    outDir: mode === "pages" ? "dist-pages" : "dist",
    rollupOptions: {
      input:
        mode === "pages"
          ? resolve("gestao.html")
          : {
              legacy: resolve("index.html"),
              management: resolve("gestao.html"),
            },
    },
  },
}));
