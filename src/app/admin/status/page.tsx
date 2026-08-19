"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

/* ─────────────────────────────────────────────
   Design tokens — shared across all pages
   ───────────────────────────────────────────── */
const t = {
  bg: "var(--tm-bg)",
  surface: "var(--tm-panel)",
  border: "var(--tm-line)",
  text: "var(--tm-ink)",
  muted: "var(--tm-muted)",
  dim: "var(--tm-muted)",
  accent: "var(--tm-accent)",
  green: "#34d399",
  yellow: "#facc15",
  red: "#f87171",
  purple: "#a78bfa",
  orange: "#fb923c",
  cyan: "#22d3ee",
  font: "var(--font-jetbrains-mono), monospace",
  mono: "var(--font-jetbrains-mono), monospace",
};

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

type ServiceStatus = "operational" | "degraded" | "down" | "checking";

interface HealthCheck {
  name: string;
  status: ServiceStatus;
  latency: number | null;
  detail: string;
  category: string;
}

type OverallStatus = "operational" | "degraded" | "down" | "checking";

/* ─────────────────────────────────────────────
   Status config
   ───────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; color: string; icon: string }
> = {
  operational: { label: "Operational", color: t.green, icon: "●" },
  degraded: { label: "Degraded", color: t.yellow, icon: "◐" },
  down: { label: "Down", color: t.red, icon: "○" },
  checking: { label: "Checking…", color: t.dim, icon: "◌" },
};

const OVERALL_CONFIG: Record<
  OverallStatus,
  { label: string; color: string; bg: string }
> = {
  operational: {
    label: "All Systems Operational",
    color: t.green,
    bg: `${t.green}12`,
  },
  degraded: {
    label: "Partial Degradation",
    color: t.yellow,
    bg: `${t.yellow}12`,
  },
  down: {
    label: "Service Disruption",
    color: t.red,
    bg: `${t.red}12`,
  },
  checking: {
    label: "Checking Systems…",
    color: t.dim,
    bg: `${t.dim}08`,
  },
};

/* ─────────────────────────────────────────────
   System info (static)
   ───────────────────────────────────────────── */

const SYSTEM_INFO: { label: string; value: string; color: string }[] = [
  { label: "Frontend", value: "Next.js 15 · React 19 · TypeScript", color: t.accent },
  { label: "Backend", value: "Laravel 8 · PHP 8.1 · Railway (api.tastemakersapp.com)", color: t.purple },
  { label: "Database", value: "PostgreSQL · Supabase · 31 tables", color: t.yellow },
  { label: "Auth", value: "Laravel Passport · OAuth2 Bearer", color: t.green },
  { label: "Cache", value: "file driver (no Redis in prod)", color: t.orange },
  { label: "API Endpoints", value: "41 routes", color: t.cyan },
  { label: "Models", value: "9 Eloquent models", color: t.red },
  { label: "Test Coverage", value: "106 PHPUnit · 392 Vitest", color: t.green },
];

/* ─────────────────────────────────────────────
   Components
   ───────────────────────────────────────────── */

function Card({
  children,
  style: s,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: t.surface,
        borderRadius: 8,
        border: `1px solid ${t.border}`,
        padding: "20px 24px",
        ...s,
      }}
    >
      {children}
    </div>
  );
}

function Spinner({ size = 16, color = t.dim }: { size?: number; color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid ${color}40`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Health check runner
   ───────────────────────────────────────────── */

async function checkEndpoint(
  url: string,
  timeoutMs = 8000
): Promise<{ ok: boolean; latency: number; detail: string }> {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    const latency = Math.round(performance.now() - start);
    clearTimeout(timer);

    if (res.ok) {
      return { ok: true, latency, detail: `${res.status} OK` };
    }
    return {
      ok: false,
      latency,
      detail: `${res.status} ${res.statusText}`,
    };
  } catch (err) {
    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "Timeout"
        : err instanceof TypeError
          ? "Connection refused"
          : "Network error";
    return { ok: false, latency, detail: message };
  }
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function StatusPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: "API Server", status: "checking", latency: null, detail: "Checking…", category: "Core" },
    { name: "Database (via API)", status: "checking", latency: null, detail: "Checking…", category: "Core" },
    { name: "Auth Provider", status: "checking", latency: null, detail: "Checking…", category: "Core" },
    { name: "Web Frontend", status: "checking", latency: null, detail: "Checking…", category: "Core" },
    { name: "Foursquare API", status: "checking", latency: null, detail: "Checking…", category: "External" },
    { name: "Google OAuth", status: "checking", latency: null, detail: "Checking…", category: "External" },
  ]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateCheck = useCallback(
    (name: string, update: Partial<HealthCheck>) => {
      setChecks((prev) =>
        prev.map((c) => (c.name === name ? { ...c, ...update } : c))
      );
    },
    []
  );

  const runChecks = useCallback(async () => {
    setIsRunning(true);
    // Reset all to checking
    setChecks((prev) =>
      prev.map((c) => ({
        ...c,
        status: "checking" as ServiceStatus,
        latency: null,
        detail: "Checking…",
      }))
    );

    // API Server — hit the proxy which goes to localhost:4050
    const apiCheck = checkEndpoint("/api/tags").then((r) => {
      updateCheck("API Server", {
        status: r.ok ? "operational" : "down",
        latency: r.latency,
        detail: r.ok
          ? `Responding · ${r.latency}ms · ${r.detail}`
          : `Unreachable · ${r.detail}`,
      });
      return r;
    });

    // Database — if API returns data, DB is working (tags query hits PostgreSQL)
    apiCheck.then((r) => {
      updateCheck("Database (via API)", {
        status: r.ok ? "operational" : "down",
        latency: r.ok ? r.latency : null,
        detail: r.ok
          ? `PostgreSQL responding via /api/tags · ${r.latency}ms`
          : `Cannot verify — API unreachable`,
      });
    });

    // Auth provider — hit login endpoint with empty body (expect 4xx, not 5xx/timeout)
    checkEndpoint("/api/login").then((r) => {
      // A 422/401/405 means the auth system is up (it rejected invalid input)
      const isUp = r.detail.startsWith("4") || r.detail.startsWith("2") || r.ok;
      updateCheck("Auth Provider", {
        status: isUp ? "operational" : "down",
        latency: r.latency,
        detail: isUp
          ? `Passport OAuth2 responding · ${r.latency}ms`
          : `Unreachable · ${r.detail}`,
      });
    });

    // Web frontend — check that Next.js is serving (self-check)
    const webStart = performance.now();
    updateCheck("Web Frontend", {
      status: "operational",
      latency: Math.round(performance.now() - webStart),
      detail: "Next.js 15 · This page loaded successfully",
    });

    // Foursquare API — check API availability
    checkEndpoint("https://api.foursquare.com/v2/venues/search?v=20240101", 5000).then(
      (r) => {
        // Foursquare returns 400 without params but that means it's up
        const isUp =
          r.ok || r.detail.startsWith("4") || r.detail.startsWith("2");
        updateCheck("Foursquare API", {
          status: isUp ? "operational" : r.detail === "Timeout" ? "degraded" : "down",
          latency: r.latency,
          detail: isUp
            ? `Reachable · ${r.latency}ms · ${r.detail}`
            : `${r.detail} · ${r.latency}ms`,
        });
      }
    );

    // Google OAuth
    checkEndpoint("https://accounts.google.com/.well-known/openid-configuration", 5000).then(
      (r) => {
        updateCheck("Google OAuth", {
          status: r.ok ? "operational" : r.detail === "Timeout" ? "degraded" : "down",
          latency: r.latency,
          detail: r.ok
            ? `OpenID config reachable · ${r.latency}ms`
            : `${r.detail} · ${r.latency}ms`,
        });
      }
    );

    // Wait for all to settle, then update timestamp
    await Promise.allSettled([apiCheck]);
    setLastChecked(new Date());
    setIsRunning(false);
  }, [updateCheck]);

  // Run checks on mount
  useEffect(() => {
    runChecks();
  }, [runChecks]);

  // Compute overall status
  const overall: OverallStatus = checks.some((c) => c.status === "checking")
    ? "checking"
    : checks.every((c) => c.status === "operational")
      ? "operational"
      : checks.some((c) => c.status === "down")
        ? checks.filter((c) => c.status === "down").length > 2
          ? "down"
          : "degraded"
        : "degraded";

  const overallCfg = OVERALL_CONFIG[overall];

  return (
    <div>
      {/* ── Keyframes for spinner ── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
          { label: "status", active: true, href: "/admin/status" },
          { label: "overview.tsx", active: false, href: "/admin" },
        ].map((tab) => (
          <a
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
          </a>
        ))}
      </div>

      <div style={{ padding: "14px 18px", fontFamily: t.font, color: t.text }}>
        <div style={{ color: t.muted, marginBottom: 16, fontSize: 11.5 }}>
          <span style={{ color: t.accent }}>$</span> tm status --live
        </div>

      <div style={{ maxWidth: 1100 }}>
        {/* ── 01 Overall Status Banner ── */}
        <div
          style={{
            padding: "24px 28px",
            borderRadius: 10,
            border: `1px solid ${overallCfg.color}40`,
            background: overallCfg.bg,
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {overall === "checking" ? (
              <Spinner size={22} color={overallCfg.color} />
            ) : (
              <span
                style={{
                  fontSize: 28,
                  color: overallCfg.color,
                  lineHeight: 1,
                }}
              >
                {overall === "operational"
                  ? "●"
                  : overall === "degraded"
                    ? "◐"
                    : "○"}
              </span>
            )}
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: overallCfg.color,
                }}
              >
                {overallCfg.label}
              </div>
              {lastChecked && (
                <div
                  style={{
                    fontSize: 12,
                    color: t.dim,
                    fontFamily: t.mono,
                    marginTop: 2,
                  }}
                >
                  Last checked:{" "}
                  {lastChecked.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={runChecks}
            disabled={isRunning}
            style={{
              padding: "10px 20px",
              borderRadius: 6,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: isRunning ? t.dim : t.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: isRunning ? "not-allowed" : "pointer",
              fontFamily: t.font,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isRunning && <Spinner size={14} color={t.accent} />}
            {isRunning ? "Checking…" : "Refresh"}
          </button>
        </div>

        {/* ── 02 Individual Health Checks ── */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: t.text,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              color: t.accent,
              fontFamily: t.mono,
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            01
          </span>
          Health Checks
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
            marginBottom: 48,
          }}
        >
          {checks.map((check) => {
            const cfg = STATUS_CONFIG[check.status];
            return (
              <Card
                key={check.name}
                style={{
                  borderColor:
                    check.status === "checking"
                      ? t.border
                      : `${cfg.color}40`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {check.status === "checking" ? (
                      <Spinner size={16} color={t.accent} />
                    ) : (
                      <span style={{ fontSize: 18, color: cfg.color }}>
                        {cfg.icon}
                      </span>
                    )}
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: t.text,
                      }}
                    >
                      {check.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 12,
                      color: cfg.color,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 4,
                      background: `${cfg.color}15`,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Latency */}
                {check.latency !== null && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: t.mono,
                        fontSize: 22,
                        fontWeight: 700,
                        color:
                          check.latency < 200
                            ? t.green
                            : check.latency < 1000
                              ? t.yellow
                              : t.red,
                      }}
                    >
                      {check.latency}
                    </span>
                    <span
                      style={{
                        fontFamily: t.mono,
                        fontSize: 12,
                        color: t.dim,
                      }}
                    >
                      ms
                    </span>
                  </div>
                )}

                {/* Detail */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: t.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {check.detail}
                </p>

                {/* Category */}
                <div style={{ marginTop: 8 }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: t.mono,
                      background: `${t.dim}18`,
                      color: t.dim,
                      border: `1px solid ${t.dim}30`,
                    }}
                  >
                    {check.category}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── 03 System Information ── */}
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: t.text,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              color: t.accent,
              fontFamily: t.mono,
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            02
          </span>
          System Information
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
            marginBottom: 48,
          }}
        >
          {SYSTEM_INFO.map((info) => (
            <Card key={info.label} style={{ padding: "14px 18px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: t.mono,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: info.color,
                  marginBottom: 6,
                }}
              >
                {info.label}
              </div>
              <div style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>
                {info.value}
              </div>
            </Card>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
