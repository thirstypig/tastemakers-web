import { runCheck, shortBody, type Check, type CheckResult } from "@/lib/api-probe";

const API = "https://api.tastemakersapp.com";

const t = {
  bg: "#0f0f23",
  surface: "#16162a",
  border: "#2a2a4a",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  green: "#34d399",
  red: "#f87171",
  yellow: "#fbbf24",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace',
};


const CHECKS: Check[] = [
  {
    name: "Health check",
    description: "Confirms the API container is running and responding",
    method: "GET",
    url: `${API}/health`,
    expectStatus: 200,
  },
  {
    name: "Login — bad credentials",
    description: "Confirms DB is connected and auth path executes",
    method: "POST",
    url: `${API}/api/login`,
    expectStatus: 200,
    note: 'Expects {"status":false} — a proper rejection means the users table exists and Passport is active',
    init: {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "probe@tastemakersapp.com", password: "probe-test-only" }),
    },
  },
  {
    name: "Public restaurant list",
    description: "Confirms the public data endpoint is reachable (no auth required)",
    method: "GET",
    url: `${API}/api/restaurants`,
    expectStatus: 200,
  },
  {
    name: "Auth guard (no token)",
    description: "GET /api/user without a Bearer token — must return 401",
    method: "GET",
    url: `${API}/api/user`,
    expectStatus: 401,
    note: "A 401 here is the correct result — proves the auth middleware is enforcing token requirements",
  },
];

function statusColor(ok: boolean, status: number | null) {
  if (ok) return t.green;
  if (status === null) return t.red;
  return t.red;
}

function badge(ok: boolean) {
  return ok ? "PASS" : "FAIL";
}

function badgeBg(ok: boolean) {
  return ok ? `${t.green}20` : `${t.red}20`;
}

function badgeBorder(ok: boolean) {
  return ok ? `${t.green}50` : `${t.red}50`;
}


export default async function ApiTestPage() {
  const results = await Promise.all(CHECKS.map(runCheck));
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const allPass = passed === total;

  return (
    <div style={{ padding: 40, fontFamily: t.font, maxWidth: 860 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>
          API Test
        </h1>
        <p style={{ color: t.muted, fontSize: 13, margin: "6px 0 0" }}>
          Live checks against{" "}
          <span style={{ fontFamily: t.mono, color: t.accent }}>{API}</span>
          {" "}— refreshed on every page load
        </p>
      </div>

      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 20px",
          background: allPass ? `${t.green}12` : `${t.red}12`,
          border: `1px solid ${allPass ? t.green : t.red}40`,
          borderRadius: 8,
          marginBottom: 28,
        }}
      >
        <span style={{ fontSize: 20 }}>{allPass ? "✓" : "✗"}</span>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: allPass ? t.green : t.red }}>
            {passed}/{total} checks passing
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: t.muted }}>
            {allPass
              ? "All endpoints responding as expected"
              : `${total - passed} endpoint${total - passed !== 1 ? "s" : ""} need attention`}
          </p>
        </div>
      </div>

      {/* Check cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {results.map((r) => (
          <div
            key={r.name}
            style={{
              background: t.surface,
              border: `1px solid ${r.ok ? t.border : `${t.red}40`}`,
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: t.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: `${t.accent}18`,
                    color: t.accent,
                    border: `1px solid ${t.accent}30`,
                  }}
                >
                  {r.method}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{r.name}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {r.status !== null && (
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 12,
                      color: statusColor(r.ok, r.status),
                    }}
                  >
                    HTTP {r.status}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: badgeBg(r.ok),
                    color: r.ok ? t.green : t.red,
                    border: `1px solid ${badgeBorder(r.ok)}`,
                    letterSpacing: "0.05em",
                  }}
                >
                  {badge(r.ok)}
                </span>
                <span style={{ fontFamily: t.mono, fontSize: 11, color: t.dim }}>
                  {r.ms}ms
                </span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "14px 20px" }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: t.muted }}>
                {r.description}
              </p>
              {r.note && (
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 11,
                    color: t.dim,
                    fontStyle: "italic",
                  }}
                >
                  {r.note}
                </p>
              )}
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 11,
                  color: t.muted,
                  background: t.bg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 6,
                  padding: "10px 14px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}
              >
                {r.error ? (
                  <span style={{ color: t.red }}>{r.error}</span>
                ) : (
                  shortBody(r.body)
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        style={{
          marginTop: 32,
          padding: "16px 20px",
          background: `${t.yellow}10`,
          border: `1px solid ${t.yellow}30`,
          borderRadius: 8,
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: t.yellow, fontWeight: 600 }}>
          Future: Migrate auth to Supabase
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: t.muted }}>
          Currently using Laravel Passport (OAuth2). Plan: replace with Supabase Auth so iOS, Android,
          and web share one auth provider. The login endpoint above will change to a Supabase JWT
          exchange once that migration is done.
        </p>
      </div>
    </div>
  );
}
