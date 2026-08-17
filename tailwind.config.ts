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
        // App palette (v2) — pixel-matched to the iOS app. Literal hex, not
        // var(), because these are scoped to .tm-app in globals.css and
        // Tailwind utilities are also used outside that wrapper.
        "app-purple":       "#2A1A5E",
        "app-tag":          "#3D2A75",
        "app-tag-light":    "#7C67B8",
        "app-tag-mine-bg":  "#EDEAF5",
        "app-tag-mine-fg":  "#8E88A0",
        "app-crimson":      "#C7255B",
        "app-crimson-dark": "#A31A49",
        "app-canvas":       "#F1F1F3",
        "app-card":         "#FFFFFF",
        "app-strip":        "#F7F6F9",
        "app-border":       "#E2DEEA",
        "app-hairline":     "#EDEBF1",
        "app-ink":          "#1D1730",
        "app-muted":        "#98939F",
        "app-faint":        "#B4AFBD",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        sans: ["var(--font-roboto)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      borderRadius: {
        tag: "4px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(29, 23, 48, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;

