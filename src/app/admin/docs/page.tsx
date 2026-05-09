const t = {
  bg: "#0f0f23",
  surface: "#16162a",
  border: "#2a2a4a",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  green: "#34d399",
  yellow: "#fbbf24",
  purple: "#a78bfa",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace',
};

type DocEntry = {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
  badgeColor?: string;
};

const DOCS: DocEntry[] = [
  {
    id: "going-live",
    title: "Going Live Roadmap",
    description: "Migration status, iOS/Android/web plans, infrastructure summary, what's left to do",
    category: "Roadmap",
    badge: "Active",
    badgeColor: t.green,
  },
  {
    id: "backend-claude",
    title: "Backend — CLAUDE.md",
    description: "Laravel API tech stack, port assignments, API routes, known issues, implementation plan",
    category: "Codebase",
    badge: "Laravel",
    badgeColor: t.accent,
  },
  {
    id: "web-claude",
    title: "Web App — CLAUDE.md",
    description: "Next.js architecture, dev setup, API integration, implementation phases",
    category: "Codebase",
    badge: "Next.js",
    badgeColor: t.accent,
  },
  {
    id: "backend-todos",
    title: "Backend Todos (31 items)",
    description: "P1 critical security issues, P2 architecture improvements, P3 nice-to-haves",
    category: "Tasks",
    badge: "P1 open",
    badgeColor: "#f87171",
  },
  {
    id: "cross-todos",
    title: "Cross-Project Todos (19 items)",
    description: "API field mismatches, Android build blockers, web token security, WordPress credentials",
    category: "Tasks",
    badge: "P1 open",
    badgeColor: "#f87171",
  },
];

const CATEGORIES = Array.from(new Set(DOCS.map((d) => d.category)));

export default function DocsIndexPage() {
  return (
    <div style={{ padding: 40, fontFamily: t.font, maxWidth: 800 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>
          Documentation
        </h1>
        <p style={{ color: t.muted, fontSize: 13, margin: "6px 0 0" }}>
          CLAUDE.md files, todos, and project roadmaps — rendered from source
        </p>
      </div>

      {CATEGORIES.map((category) => (
        <div key={category} style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: t.dim,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              margin: "0 0 12px",
            }}
          >
            {category}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DOCS.filter((d) => d.category === category).map((doc) => (
              <a
                key={doc.id}
                href={`/admin/docs/${doc.id}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "16px 20px",
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${t.accent}60`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = t.border;
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: t.text }}>
                    {doc.title}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: t.muted, lineHeight: 1.5 }}>
                    {doc.description}
                  </p>
                </div>
                {doc.badge && (
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: `${doc.badgeColor}20`,
                      color: doc.badgeColor,
                      border: `1px solid ${doc.badgeColor}40`,
                      letterSpacing: "0.05em",
                      marginTop: 1,
                    }}
                  >
                    {doc.badge}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      ))}

      {/* Quick links */}
      <div
        style={{
          marginTop: 8,
          padding: "16px 20px",
          background: `${t.purple}10`,
          border: `1px solid ${t.purple}30`,
          borderRadius: 8,
        }}
      >
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: t.purple, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Live Dashboards
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "API Test", href: "/admin/api" },
            { label: "System Status", href: "/status" },
            { label: "Roadmap", href: "/roadmap" },
            { label: "Changelog", href: "/changelog" },
            { label: "Analytics", href: "/analytics" },
            { label: "Under the Hood", href: "/tech" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: 12,
                color: t.muted,
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: 4,
                background: `${t.border}80`,
                border: `1px solid ${t.border}`,
              }}
            >
              {link.label} →
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
