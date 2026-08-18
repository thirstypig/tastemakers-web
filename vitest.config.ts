import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  // Component tests are .tsx. Without this plugin the JSX is never transformed
  // and vitest dies at parse — the repo had @testing-library/react installed
  // but no transform, so no component test had ever run.
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    // scripts/ are plain ESM build tooling — .mjs, not TypeScript — but they generate
    // docs shown to outside parties, so they need coverage too.
    // .tsx too: component tests need JSX, and a .ts-only glob silently skips
    // them — vitest reports "No test files found" rather than failing loudly.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.mjs"],
  },
});
