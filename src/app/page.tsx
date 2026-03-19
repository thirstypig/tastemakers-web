const t = {
  bg: "#0f0f23",
  surface: "#16162a",
  border: "#2a2a4a",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace',
};

const NAV_LINKS: { href: string; label: string; description: string }[] = [
  { href: "/tech", label: "Under the Hood", description: "Architecture, tech stack, database schema, and how this was built" },
  { href: "/roadmap", label: "Roadmap", description: "Project health, 50 tracked findings, and prioritized fix plan" },
  { href: "/changelog", label: "Changelog", description: "Release history with 9 versions and 99 tracked changes" },
  { href: "/status", label: "System Status", description: "Live health checks for API, database, auth, and external services" },
  { href: "/analytics", label: "Analytics", description: "Development velocity, product metrics, and key questions" },
  { href: "/admin", label: "Admin Panel", description: "Dashboard and login with sidebar navigation" },
];

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: t.font,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: -1,
          margin: "0 0 8px",
        }}
      >
        Tastemakers
      </h1>
      <p style={{ color: t.muted, fontSize: 15, margin: "0 0 40px" }}>
        Discover restaurants through trusted tastemakers.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          width: "100%",
          maxWidth: 900,
        }}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: "block",
              padding: "20px 24px",
              background: t.surface,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = t.accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = t.border;
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, color: t.accent, marginBottom: 6 }}>
              {link.label} &rarr;
            </div>
            <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.5 }}>
              {link.description}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
