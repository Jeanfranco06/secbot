import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: "dist-widget",
    lib: {
      entry: path.resolve(__dirname, "src/widget/embed.jsx"),
      name: "SecBotWidget",
      formats: ["iife"],
      fileName: () => "secbot-widget.js",
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});