import { defineConfig } from "vite";
import { resolve } from "node:path";
export default defineConfig({
  server: { proxy: { "/api": { target: "http://127.0.0.1:4173" } } },
  build: {
    rollupOptions: {
      input: {
        legacy: resolve("index.html"),
        management: resolve("gestao.html"),
      },
    },
  },
});
