"use client";

const t = {
  bg: "#0f0f23",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

export default function AdminDashboard() {
  return (
    <div style={{ padding: 40, fontFamily: t.font }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 8 }}>
        Dashboard
      </h1>
      <p style={{ color: t.muted, fontSize: 14 }}>
        Admin dashboard coming soon. Use the sidebar to navigate.
      </p>
      <div style={{ marginTop: 24, display: "flex", gap: 16 }}>
        <a
          href="/tech"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 6,
            background: `${t.accent}18`,
            color: t.accent,
            border: `1px solid ${t.accent}40`,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Under the Hood →
        </a>
        <a
          href="/admin/login"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 6,
            background: `${t.dim}18`,
            color: t.muted,
            border: `1px solid ${t.dim}40`,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Login
        </a>
      </div>
    </div>
  );
}
