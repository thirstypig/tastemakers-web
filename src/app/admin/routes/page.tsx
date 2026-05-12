import Link from "next/link";

const ROUTES = [
  { method: "POST", path: "/api/login", auth: "public", platforms: "all", p95: "—", reqs: "847" },
  { method: "POST", path: "/api/signup", auth: "public", platforms: "all", p95: "—", reqs: "212" },
  { method: "POST", path: "/api/google-login", auth: "public", platforms: "all", p95: "—", reqs: "341" },
  { method: "POST", path: "/api/apple-login", auth: "public", platforms: "ios", p95: "—", reqs: "98" },
  { method: "GET", path: "/api/user", auth: "bearer", platforms: "all", p95: "142ms", reqs: "12,041" },
  { method: "POST", path: "/api/update-profile", auth: "bearer", platforms: "all", p95: "—", reqs: "203" },
  { method: "GET", path: "/api/restaurants", auth: "mixed", platforms: "all", p95: "—", reqs: "8,421" },
  { method: "GET", path: "/api/restaurant-detail", auth: "mixed", platforms: "all", p95: "—", reqs: "3,182" },
  { method: "POST", path: "/api/restaurant-save", auth: "bearer", platforms: "all", p95: "—", reqs: "1,024" },
  { method: "POST", path: "/api/restaurant-tag", auth: "bearer", platforms: "all", p95: "—", reqs: "492" },
  { method: "GET", path: "/api/tags", auth: "bearer", platforms: "all", p95: "—", reqs: "2,841" },
  { method: "POST", path: "/api/search-tags", auth: "bearer", platforms: "all", p95: "—", reqs: "714" },
  { method: "GET", path: "/api/gettastemaker-List", auth: "bearer", platforms: "all", p95: "—", reqs: "1,337" },
  { method: "POST", path: "/api/ListTitleSave", auth: "bearer", platforms: "all", p95: "—", reqs: "88" },
  { method: "POST", path: "/api/nearbycuisine", auth: "mixed", platforms: "all", p95: "—", reqs: "0" },
  { method: "GET", path: "/api/review_count", auth: "bearer", platforms: "all", p95: "—", reqs: "4,219" },
  { method: "DELETE", path: "/api/image-delete", auth: "public", platforms: "all", p95: "—", reqs: "12" },
];

const METHOD_FILTERS = ["GET", "POST", "PUT", "DELETE"];
const AUTH_FILTERS = ["public", "bearer", "mixed"];

function methodColor(m: string) {
  if (m === "GET") return "var(--tm-accent)";
  if (m === "POST") return "var(--tm-warn)";
  if (m === "DELETE") return "var(--tm-err)";
  return "var(--tm-muted)";
}

function authColor(a: string) {
  if (a === "public") return "var(--tm-err)";
  if (a === "bearer") return "var(--tm-accent)";
  return "var(--tm-warn)";
}

function TRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        padding: "7px 14px",
        borderBottom: last ? "none" : "1px solid var(--tm-line)",
        fontSize: 11.5,
        color: "var(--tm-ink)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}

export default function RoutesPage() {
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
          { label: "routes.json", active: true, href: "/admin/routes" },
          { label: "overview.tsx", active: false, href: "/admin" },
          { label: "errors.log", active: false, href: "/admin/errors" },
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
        <div style={{ color: "var(--tm-muted)", marginBottom: 14, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> cat routes.json | jq
        </div>

        {/* Method filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {METHOD_FILTERS.map((f, i) => (
            <span
              key={f}
              style={{
                fontSize: 10.5,
                padding: "2px 8px",
                border: "1px solid var(--tm-line)",
                borderRadius: 3,
                background: i === 0 ? "var(--tm-accent-bg)" : "transparent",
                color: i === 0 ? "var(--tm-accent)" : "var(--tm-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              [{f}]
            </span>
          ))}
          <span
            style={{
              marginLeft: 8,
              fontSize: 10.5,
              color: "var(--tm-muted)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            auth:
          </span>
          {AUTH_FILTERS.map((f) => (
            <span
              key={f}
              style={{
                fontSize: 10.5,
                padding: "2px 8px",
                border: "1px solid var(--tm-line)",
                borderRadius: 3,
                color: "var(--tm-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              [{f}]
            </span>
          ))}
        </div>

        {/* Routes table */}
        <div
          style={{
            background: "var(--tm-panel)",
            border: "1px solid var(--tm-line)",
            borderRadius: 6,
          }}
        >
          {/* Header */}
          <TRow>
            <span style={{ width: 64, color: "var(--tm-muted)" }}>METHOD</span>
            <span style={{ flex: 1, color: "var(--tm-muted)" }}>PATH</span>
            <span style={{ width: 64, color: "var(--tm-muted)" }}>AUTH</span>
            <span style={{ width: 80, color: "var(--tm-muted)" }}>PLATFORMS</span>
            <span style={{ width: 72, color: "var(--tm-muted)" }}>P95</span>
            <span style={{ width: 72, color: "var(--tm-muted)" }}>24H REQS</span>
          </TRow>
          {ROUTES.map((r, i) => (
            <TRow key={r.path + r.method} last={i === ROUTES.length - 1}>
              <span
                style={{
                  width: 64,
                  color: methodColor(r.method),
                  fontWeight: 600,
                }}
              >
                {r.method}
              </span>
              <span style={{ flex: 1 }}>{r.path}</span>
              <span style={{ width: 64, color: authColor(r.auth) }}>
                {r.auth}
              </span>
              <span style={{ width: 80, color: "var(--tm-muted)" }}>
                {r.platforms}
              </span>
              <span style={{ width: 72, color: "var(--tm-muted)" }}>
                {r.p95}
              </span>
              <span style={{ width: 72 }}>{r.reqs}</span>
            </TRow>
          ))}
        </div>
      </div>
    </div>
  );
}
