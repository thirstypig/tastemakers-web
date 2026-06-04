import Link from "next/link";

const RELEASES = [
  {
    v: "v8.8.0",
    date: "2026-06-03",
    title: "User auth + site consolidation",
    items: [
      { type: "+", text: "End-user Supabase auth — AuthProvider + useAuth(), session refresh in middleware" },
      { type: "+", text: "Marketing home at / + /explore hub (replaces / → /restaurants redirect)" },
      { type: "+", text: "/review inline auth-gate stub; /profile/* route protection" },
      { type: "+", text: "Auth-aware Nav on marketing/app-shell routes" },
      { type: "~", text: "Auth redirects default to /explore; login honors ?next (open-redirect-safe)" },
    ],
  },
  {
    v: "v8.7.0",
    date: "2026-06-03",
    title: "Privacy & analytics",
    items: [
      { type: "+", text: "Privacy Policy pages live on marketing + web app (/privacy)" },
      { type: "+", text: "GA4 (G-062TFF0ZGE) on both sites with Consent Mode v2" },
      { type: "+", text: "Google AdSense loader + Privacy & messaging consent CMP" },
      { type: "+", text: "ads.txt deployed; AdSense site submitted for review" },
      { type: "~", text: "Consent denied by default in EEA/UK until granted" },
    ],
  },
  {
    v: "v8.6.3",
    date: "2026-05-11",
    title: "Security sprint",
    items: [
      { type: "+", text: "9 PHPUnit feature tests added (AuthTest + UserProfileTest)" },
      { type: "~", text: "Removed hardcoded FCM key → moved to .env + config/services.php" },
      { type: "~", text: "Stripped all debug echo/print_r statements" },
      { type: "~", text: "role_id removed from User $fillable — privilege escalation fixed" },
      { type: "~", text: "Mass assignment risk resolved, UserFactory updated" },
    ],
  },
  {
    v: "v8.6.2",
    date: "2026-05-04",
    title: "Railway cutover",
    items: [
      { type: "+", text: "api.tastemakersapp.com live on Railway (CNAME + cert)" },
      { type: "+", text: "Passport RSA keys stored as env vars, written to disk on boot" },
      { type: "~", text: "PHP pinned to 8.1 (Laravel 8 incompatible with 8.4+)" },
      { type: "~", text: "PostgreSQL on Supabase — connection strings configured for all 5 services" },
    ],
  },
  {
    v: "v8.6.1",
    date: "2026-04-22",
    title: "Cross-project code review",
    items: [
      { type: "+", text: "84 findings catalogued across all 5 repos (22 P1, 35 P2, 27 P3)" },
      { type: "+", text: "todos/ directory created with structured issue files" },
      { type: "-", text: "Android build confirmed broken (Hilt DI module missing)" },
      { type: "-", text: "iOS multi-image upload confirmed broken (Content-Type boundary mismatch)" },
    ],
  },
  {
    v: "v8.6.0",
    date: "2026-04-01",
    title: "Supabase migration",
    items: [
      { type: "+", text: "PostgreSQL on Supabase — all tables migrated from MySQL" },
      { type: "~", text: "MySQL-specific SQL rewritten for PostgreSQL compatibility" },
      { type: "-", text: "GROUP BY, IFNULL, IF() calls identified for rewrite" },
    ],
  },
];

function typeColor(t: string) {
  if (t === "+") return "var(--tm-accent)";
  if (t === "-") return "var(--tm-err)";
  return "var(--tm-warn)";
}

export default function ChangelogPage() {
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
          { label: "CHANGELOG.md", active: true, href: "/admin/changelog" },
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 160px",
          gap: 0,
        }}
      >
        {/* Main content */}
        <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 16, fontSize: 11.5 }}>
            <span style={{ color: "var(--tm-accent)" }}>$</span> cat CHANGELOG.md
          </div>

          {RELEASES.map((r) => (
            <div key={r.v} id={r.v} style={{ marginBottom: 24 }}>
              {/* Version header */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--tm-ink)",
                  marginBottom: 4,
                }}
              >
                ## {r.v} — {r.date}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--tm-muted)",
                  marginBottom: 8,
                }}
              >
                {r.title}
              </div>

              {/* Items */}
              <div
                style={{
                  background: "var(--tm-panel)",
                  border: "1px solid var(--tm-line)",
                  borderRadius: 6,
                }}
              >
                {r.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 14px",
                      borderBottom:
                        i === r.items.length - 1
                          ? "none"
                          : "1px solid var(--tm-line)",
                      display: "flex",
                      gap: 10,
                      fontSize: 11.5,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        color: typeColor(item.type),
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={{ color: "var(--tm-ink)" }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* TOC */}
        <div
          style={{
            borderLeft: "1px solid var(--tm-line)",
            padding: "14px 12px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            position: "sticky" as const,
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--tm-muted)",
              marginBottom: 8,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
            }}
          >
            versions
          </div>
          {RELEASES.map((r) => (
            <a
              key={r.v}
              href={`#${r.v}`}
              style={{
                display: "block",
                fontSize: 11,
                color: "var(--tm-muted)",
                textDecoration: "none",
                padding: "3px 0",
              }}
            >
              {r.v}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
