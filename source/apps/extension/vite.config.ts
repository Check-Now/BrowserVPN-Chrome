import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        background: resolve(__dirname, "src/background/index.ts")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  },
  plugins: [
    {
      name: "copy-manifest",
      closeBundle() {
        copyFileSync("manifest.json", "dist/manifest.json");
      }
    }
  ],
  test: {
    include: ["../../tests/**/*.test.ts"]
  }
});
