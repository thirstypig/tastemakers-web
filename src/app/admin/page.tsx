import Link from "next/link";

// ── Fixture data (wire to real APIs once backend endpoints exist) ─
const KPIS = [
  { label: "total_users", value: "12,847", delta: "+184", period: "7d", trend: "up" },
  { label: "dau", value: "2,143", delta: "+6.2%", period: "24h", trend: "up" },
  { label: "restaurants_saved", value: "48,219", delta: "+1,204", period: "7d", trend: "up" },
  { label: "api_p95_latency", value: "142ms", delta: "-18ms", period: "24h", trend: "up" },
  { label: "error_rate", value: "0.34%", delta: "+0.08", period: "24h", trend: "down" },
  { label: "tests_passing", value: "1 / 9", delta: "—", period: "", trend: "flat" },
];

const PLATFORMS = [
  { id: "ios", name: "ios", status: "live", version: "2.14.0", users: "8,402", notes: "Swift / UIKit · 18 open todos" },
  { id: "android", name: "android", status: "beta", version: "0.9.2", users: "1,981", notes: "Kotlin / Compose · phase 3" },
  { id: "web", name: "web", status: "staging", version: "0.4.1", users: "2,464", notes: "Next.js 15 · 5 dashboards live" },
  { id: "api", name: "api", status: "live", version: "8.6.3", users: "—", notes: "Laravel 8 · Railway · pgsql 5446" },
];

const ERRORS = [
  { time: "14:02", code: "500", route: "GET /api/user", msg: "in failed sql transaction", count: 12 },
  { time: "13:48", code: "500", route: "GET /api/restaurants", msg: "FOURSQUARE_API_KEY missing", count: 47 },
  { time: "12:31", code: "401", route: "POST /api/apple-login", msg: "JWT verification skipped", count: 3 },
  { time: "11:09", code: "422", route: "POST /api/signup", msg: "email already exists", count: 8 },
];

const ROADMAP = [
  { phase: "P1", title: "Auth on delete endpoints", status: "in_progress" },
  { phase: "P1", title: "Apple Sign-In JWT verify", status: "open" },
  { phase: "P1", title: "IDOR — drop user_id from body", status: "in_progress" },
  { phase: "P2", title: "Form Request validation", status: "open" },
  { phase: "P2", title: "Move token to Keychain", status: "open" },
  { phase: "P3", title: "Bulk rename complition→completion", status: "open" },
];

function statusColor(status: string) {
  if (status === "live") return "var(--tm-accent)";
  if (status === "beta") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

function phaseColor(phase: string) {
  if (phase === "P1") return "var(--tm-err)";
  if (phase === "P2") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

function trendColor(trend: string) {
  if (trend === "up") return "var(--tm-accent)";
  if (trend === "down") return "var(--tm-err)";
  return "var(--tm-muted)";
}

// Shared row component
function TRow({
  children,
  last,
}: {
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      style={{
        padding: "7px 14px",
        borderBottom: last ? "none" : "1px solid var(--tm-line)",
        fontSize: 11.5,
        color: "var(--tm-ink)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      {children}
    </div>
  );
}

export default function AdminOverview() {
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
          { label: "overview.tsx", active: true, href: "/admin" },
          { label: "errors.log", active: false, href: "/admin/errors" },
          { label: "roadmap.md", active: false, href: "/admin/roadmap" },
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
              flexShrink: 0,
              display: "block",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Scroll content */}
      <div
        style={{
          padding: "14px 18px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {/* Shell prompt */}
        <div style={{ color: "var(--tm-muted)", marginBottom: 16, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm status --all
        </div>

        {/* KPIs */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}
          >
            # kpis · 24h
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {KPIS.map((k, i) => (
              <TRow key={k.label} last={i === KPIS.length - 1}>
                <span
                  style={{
                    display: "inline-block",
                    width: 170,
                    color: "var(--tm-muted)",
                  }}
                >
                  {k.label}
                </span>
                <span
                  style={{
                    display: "inline-block",
                    width: 90,
                    color: "var(--tm-ink)",
                    fontWeight: 600,
                  }}
                >
                  {k.value}
                </span>
                <span style={{ color: trendColor(k.trend) }}>{k.delta}</span>
                {k.period && (
                  <span
                    style={{ color: "var(--tm-muted)", marginLeft: 8 }}
                  >
                    · {k.period}
                  </span>
                )}
              </TRow>
            ))}
          </div>
        </div>

        {/* Platforms */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}
          >
            # platforms
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {/* Header row */}
            <TRow>
              <span style={{ color: "var(--tm-muted)" }}>
                <span style={{ display: "inline-block", width: 74 }}>SERVICE</span>
                <span style={{ display: "inline-block", width: 86 }}>VERSION</span>
                <span style={{ display: "inline-block", width: 74 }}>USERS</span>
                <span style={{ display: "inline-block", width: 80 }}>STATUS</span>
                <span>NOTES</span>
              </span>
            </TRow>
            {PLATFORMS.map((pl, i) => (
              <Link
                key={pl.id}
                href={`/admin/platforms/${pl.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <TRow last={i === PLATFORMS.length - 1}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 74,
                      fontWeight: 600,
                      color: "var(--tm-ink)",
                    }}
                  >
                    {pl.name}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 86,
                      color: "var(--tm-muted)",
                    }}
                  >
                    {pl.version}
                  </span>
                  <span
                    style={{ display: "inline-block", width: 74 }}
                  >
                    {pl.users}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 80,
                      color: statusColor(pl.status),
                    }}
                  >
                    ● {pl.status}
                  </span>
                  <span style={{ color: "var(--tm-muted)" }}>{pl.notes}</span>
                </TRow>
              </Link>
            ))}
          </div>
        </div>

        {/* Two-column: errors | roadmap */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {/* Errors */}
          <div>
            <div
              style={{
                color: "var(--tm-muted)",
                marginBottom: 6,
                fontSize: 12,
              }}
            >
              # tail errors.log -n 4
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {ERRORS.map((e, i) => (
                <TRow key={i} last={i === ERRORS.length - 1}>
                  <div>
                    <span style={{ color: "var(--tm-muted)" }}>
                      [{e.time}]
                    </span>{" "}
                    <span
                      style={{
                        color: e.code.startsWith("5")
                          ? "var(--tm-err)"
                          : "var(--tm-warn)",
                        fontWeight: 600,
                      }}
                    >
                      {e.code}
                    </span>{" "}
                    <span>{e.route}</span>{" "}
                    <span style={{ color: "var(--tm-muted)" }}>
                      ×{e.count}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "var(--tm-muted)",
                      paddingLeft: 48,
                      marginTop: 2,
                    }}
                  >
                    ↳ {e.msg}
                  </div>
                </TRow>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div>
            <div
              style={{
                color: "var(--tm-muted)",
                marginBottom: 6,
                fontSize: 12,
              }}
            >
              # cat roadmap.md
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {ROADMAP.map((r, i) => (
                <TRow key={i} last={i === ROADMAP.length - 1}>
                  <span
                    style={{
                      color: phaseColor(r.phase),
                      fontWeight: 600,
                    }}
                  >
                    [{r.phase}]
                  </span>{" "}
                  <span>
                    {r.status === "in_progress" ? "◐" : "○"} {r.title}
                  </span>
                </TRow>
              ))}
            </div>
          </div>
        </div>

        {/* Blinking cursor */}
        <div style={{ color: "var(--tm-muted)", fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span>{" "}
          <span
            className="tm-cursor"
            style={{
              display: "inline-block",
              width: 7,
              height: 13,
              background: "var(--tm-accent)",
              verticalAlign: "text-bottom",
            }}
          />
        </div>
      </div>
    </div>
  );
}
