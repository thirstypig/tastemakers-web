"use client";

import { type ReactNode } from "react";

/* ─────────────────────────────────────────────
   Design tokens — shared with /tech page
   ───────────────────────────────────────────── */
const t = {
  bg: "#0f0f23",
  surface: "#16162a",
  border: "#2a2a4a",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  green: "#34d399",
  purple: "#a78bfa",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace',
};

/* ─────────────────────────────────────────────
   Sidebar navigation items
   ───────────────────────────────────────────── */
const NAV_ITEMS: { label: string; href: string; icon: string }[] = [
  { label: "Dashboard", href: "/admin", icon: "⌂" },
  { label: "Login", href: "/admin/login", icon: "→" },
  { label: "Under the Hood", href: "/tech", icon: "⚙" },
  { label: "Roadmap", href: "/roadmap", icon: "◎" },
  { label: "Changelog", href: "/changelog", icon: "△" },
  { label: "Analytics", href: "/analytics", icon: "▦" },
  { label: "System Status", href: "/status", icon: "◉" },
  { label: "Home", href: "/", icon: "←" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: t.font,
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 220,
          borderRight: `1px solid ${t.border}`,
          background: t.surface,
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${t.border}` }}>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: -0.3,
            }}
          >
            Tastemakers
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: t.dim, fontFamily: t.mono }}>
            Admin Panel
          </p>
        </div>

        <nav style={{ padding: "16px 0", flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                fontSize: 14,
                color: t.muted,
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${t.accent}10`;
                e.currentTarget.style.color = t.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = t.muted;
              }}
            >
              <span style={{ fontFamily: t.mono, fontSize: 16, width: 20, textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${t.border}`,
            fontSize: 11,
            color: t.dim,
          }}
        >
          Tastemakers v2.0
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
    </div>
  );
}
