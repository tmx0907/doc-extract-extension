import { defineConfig } from "vite";
import { resolve } from "path";
import { writeFileSync } from "fs";

const distManifest = {
  manifest_version: 3,
  name: "Doc Extract",
  version: "0.1.0",
  action: { default_popup: "popup.html" },
  permissions: ["clipboardWrite", "activeTab", "scripting", "storage"],
  host_permissions: ["<all_urls>"],
  background: { service_worker: "background.js", type: "module" },
  commands: {
    "toggle-extract-mode": {
      suggested_key: { default: "Ctrl+Shift+E", mac: "Command+Shift+E" },
      description: "Toggle extract mode",
    },
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["content.js"],
      css: ["ui.css"],
      run_at: "document_idle",
    },
  ],
};

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: "src/background.ts",
        content: "src/content.ts",
        popup: resolve(__dirname, "popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js", // 청크를 dist 루트에 → 확장 팝업 경로 이슈 방지
        assetFileNames: "[name][extname]",
        manualChunks: {},
      },
    },
  },
  plugins: [
    {
      name: "copy-manifest",
      closeBundle() {
        writeFileSync(
          resolve(__dirname, "dist/manifest.json"),
          JSON.stringify(distManifest, null, 2)
        );
      },
    },
  ],
});
