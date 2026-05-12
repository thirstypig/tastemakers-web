import Link from "next/link";

const SERVICES = [
  {
    id: "posthog",
    name: "PostHog",
    desc: "product analytics · session replay · feature flags",
    status: "not connected",
  },
  {
    id: "ga",
    name: "Google Analytics",
    desc: "pageviews · sessions · acquisition",
    status: "not connected",
  },
  {
    id: "search-console",
    name: "Search Console",
    desc: "impressions · clicks · keywords · indexing",
    status: "not connected",
  },
];

export default function AnalyticsPage() {
  return (
    <div>
      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--tm-line)",
          background: "var(--tm-panel)",
          fontSize: 11,
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {[
          { label: "analytics.tsx", active: true, href: "/admin/analytics" },
          { label: "overview.tsx", active: false, href: "/admin" },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              padding: "7px 14px",
              borderRight: "1px solid var(--tm-line)",
              color: tab.active ? "var(--tm-ink)" : "var(--tm-muted)",
              background: tab.active ? "var(--tm-bg)" : "transparent",
              fontWeight: tab.active ? 600 : 400,
              textDecoration: "none",
              display: "block",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
        <div style={{ color: "var(--tm-muted)", marginBottom: 16, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm analytics --status
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {SERVICES.map((s) => (
            <div
              key={s.id}
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
                padding: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--tm-muted)",
                  }}
                >
                  # {s.name.toLowerCase().replace(/ /g, "_")} · {s.status}
                </span>
                <button
                  style={{
                    fontSize: 10.5,
                    padding: "2px 10px",
                    border: "1px solid var(--tm-line)",
                    borderRadius: 3,
                    background: "transparent",
                    color: "var(--tm-accent)",
                    cursor: "pointer",
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                  }}
                >
                  [ connect → ]
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--tm-muted)" }}>
                {s.desc}
              </div>

              {/* Placeholder striped area */}
              <div
                style={{
                  marginTop: 12,
                  height: 80,
                  borderRadius: 4,
                  background:
                    "repeating-linear-gradient(135deg, var(--tm-line) 0 8px, transparent 8px 16px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10.5,
                  color: "var(--tm-muted)",
                }}
              >
                not connected — data will appear here
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
