import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Admin/dev tools palette (Paper + Gruvbox via CSS vars)
        "tm-bg": "var(--tm-bg)",
        "tm-panel": "var(--tm-panel)",
        "tm-ink": "var(--tm-ink)",
        "tm-muted": "var(--tm-muted)",
        "tm-line": "var(--tm-line)",
        "tm-accent": "var(--tm-accent)",
        "tm-accent-bg": "var(--tm-accent-bg)",
        "tm-err": "var(--tm-err)",
        "tm-warn": "var(--tm-warn)",
        // Public app palette — ported from iOS design system
        "pub-bg":       "#1A1038",
        "pub-surface":  "#2A1A60",
        "pub-surface2": "#3D296E",
        "pub-surface3": "#492A6E",
        "pub-purple":   "#594094",
        "pub-purple-md":"#876DC4",
        "pub-purple-lt":"#B7ADCF",
        "pub-purple-xs":"#EFE8FE",
        "pub-muted":    "#8b81a3",
        "pub-pink":     "#DB1657",
        "pub-pink-dark":"#B8124A",
        "pub-border":   "#3D2E6E",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        sans: ["var(--font-roboto)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

