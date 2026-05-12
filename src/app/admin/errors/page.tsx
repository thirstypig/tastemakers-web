import Link from "next/link";

const ERRORS = [
  { time: "14:02:14", code: "500", route: "GET /api/user", params: "user_id=8421", msg: "in failed sql transaction", count: 12 },
  { time: "13:48:02", code: "500", route: "GET /api/restaurants", params: "", msg: "FOURSQUARE_API_KEY missing", count: 47 },
  { time: "12:31:55", code: "401", route: "POST /api/apple-login", params: "", msg: "JWT verification skipped", count: 3 },
  { time: "11:09:33", code: "422", route: "POST /api/signup", params: "", msg: "email already exists", count: 8 },
  { time: "10:47:11", code: "500", route: "POST /api/nearbycuisine", params: "", msg: "Method not found", count: 22 },
  { time: "09:15:44", code: "500", route: "GET /api/review_count", params: "other_userid=99999", msg: "Trying to get property of non-object", count: 4 },
];

const FILTERS = ["5xx", "4xx", "200-but-error"];

function codeColor(code: string) {
  if (code.startsWith("5")) return "var(--tm-err)";
  if (code.startsWith("4")) return "var(--tm-warn)";
  return "var(--tm-muted)";
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
      }}
    >
      {children}
    </div>
  );
}

export default function ErrorsPage() {
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
          { label: "errors.log", active: true, href: "/admin/errors" },
          { label: "overview.tsx", active: false, href: "/admin" },
          { label: "routes.json", active: false, href: "/admin/routes" },
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
        {/* Live badge */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingRight: 14 }}>
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 3,
              border: "1px solid var(--tm-line)",
              color: "var(--tm-muted)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            ■ paused
          </span>
        </div>
      </div>

      <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
        {/* Shell prompt */}
        <div style={{ color: "var(--tm-muted)", marginBottom: 14, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tail -f errors.log
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {FILTERS.map((f, i) => (
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
        </div>

        {/* Error log */}
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
                <span style={{ color: "var(--tm-muted)" }}>[{e.time}]</span>{" "}
                <span style={{ color: codeColor(e.code), fontWeight: 600 }}>
                  {e.code}
                </span>{" "}
                <span>{e.route}</span>
                {e.params && (
                  <span style={{ color: "var(--tm-muted)" }}> {e.params}</span>
                )}{" "}
                <span style={{ color: "var(--tm-muted)" }}>×{e.count}</span>
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

        {/* Cursor */}
        <div style={{ color: "var(--tm-muted)", fontSize: 11.5, marginTop: 12 }}>
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
