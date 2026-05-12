import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "tm-bg": "var(--tm-bg)",
        "tm-panel": "var(--tm-panel)",
        "tm-ink": "var(--tm-ink)",
        "tm-muted": "var(--tm-muted)",
        "tm-line": "var(--tm-line)",
        "tm-accent": "var(--tm-accent)",
        "tm-accent-bg": "var(--tm-accent-bg)",
        "tm-err": "var(--tm-err)",
        "tm-warn": "var(--tm-warn)",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;

