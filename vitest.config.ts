import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    // scripts/ are plain ESM build tooling — .mjs, not TypeScript — but they generate
    // docs shown to outside parties, so they need coverage too.
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
