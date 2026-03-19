"use client";

import { type ReactNode } from "react";

/* ─────────────────────────────────────────────
   Design tokens
   ───────────────────────────────────────────── */
const t = {
  bg: "#0f0f23",
  surface: "#16162a",
  border: "#2a2a4a",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  green: "#34d399",
  yellow: "#facc15",
  red: "#f87171",
  purple: "#a78bfa",
  orange: "#fb923c",
  cyan: "#22d3ee",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace',
};

/* ─────────────────────────────────────────────
   Components
   ───────────────────────────────────────────── */

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: 48 }}>
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
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

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

function Badge({
  children,
  color = t.accent,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: t.mono,
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}

function StatBox({
  value,
  label,
  color = t.accent,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 80 }}>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          fontFamily: t.mono,
          color,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Data — Development Velocity
   ───────────────────────────────────────────── */

interface VelocityEntry {
  session: string;
  label: string;
  items: number;
  color: string;
  breakdown: { type: string; count: number }[];
}

const VELOCITY_DATA: VelocityEntry[] = [
  {
    session: "Session 1",
    label: "Backend audit & docs",
    items: 31,
    color: t.purple,
    breakdown: [
      { type: "findings", count: 31 },
    ],
  },
  {
    session: "Session 2",
    label: "Web scaffold",
    items: 7,
    color: t.green,
    breakdown: [
      { type: "features", count: 5 },
      { type: "docs", count: 2 },
    ],
  },
  {
    session: "Session 3",
    label: "API contract mapping",
    items: 19,
    color: t.yellow,
    breakdown: [
      { type: "findings", count: 19 },
    ],
  },
  {
    session: "Session 4",
    label: "Security audit",
    items: 11,
    color: t.red,
    breakdown: [
      { type: "security", count: 10 },
      { type: "performance", count: 1 },
    ],
  },
  {
    session: "Session 5",
    label: "Android assessment",
    items: 5,
    color: t.orange,
    breakdown: [
      { type: "findings", count: 5 },
    ],
  },
  {
    session: "Session 6",
    label: "/tech + /roadmap pages",
    items: 23,
    color: t.accent,
    breakdown: [
      { type: "features", count: 21 },
      { type: "docs", count: 2 },
    ],
  },
  {
    session: "Session 7",
    label: "Changelog, status, admin",
    items: 14,
    color: t.cyan,
    breakdown: [
      { type: "features", count: 12 },
      { type: "refactor", count: 2 },
    ],
  },
  {
    session: "Session 8",
    label: "Analytics page",
    items: 4,
    color: t.green,
    breakdown: [
      { type: "features", count: 3 },
      { type: "docs", count: 1 },
    ],
  },
];

const VELOCITY_MAX = Math.max(...VELOCITY_DATA.map((v) => v.items));
const VELOCITY_TOTAL = VELOCITY_DATA.reduce((s, v) => s + v.items, 0);
const VELOCITY_AVG = Math.round(VELOCITY_TOTAL / VELOCITY_DATA.length);
const VELOCITY_PEAK = VELOCITY_DATA.reduce(
  (best, v) => (v.items > best.items ? v : best),
  VELOCITY_DATA[0]
);

/* ─────────────────────────────────────────────
   Data — Product Metrics
   ───────────────────────────────────────────── */

type MetricStatus = "tracking" | "planned" | "not-started";

interface ProductMetric {
  name: string;
  description: string;
  status: MetricStatus;
  category: string;
  dataSource: string;
  color: string;
}

const PRODUCT_METRICS: ProductMetric[] = [
  {
    name: "Page Views & Navigation",
    description: "Track which pages users visit, session duration, bounce rate, and navigation flow between pages.",
    status: "planned",
    category: "Engagement",
    dataSource: "PostHog / Google Analytics",
    color: t.accent,
  },
  {
    name: "User Identity & Auth",
    description: "Login method distribution (email vs Google vs Apple), signup funnel drop-off, session length by auth type.",
    status: "planned",
    category: "Identity",
    dataSource: "Laravel Passport logs + PostHog",
    color: t.purple,
  },
  {
    name: "Restaurant Discovery",
    description: "Search queries, Foursquare API hit rate, restaurant save rate, average restaurants viewed per session.",
    status: "planned",
    category: "Core Feature",
    dataSource: "API logs + PostHog events",
    color: t.green,
  },
  {
    name: "Tagging Adoption",
    description: "Tags created per user, most popular tags, tag-to-restaurant ratio, search-by-tag conversion rate.",
    status: "planned",
    category: "Core Feature",
    dataSource: "PostgreSQL queries",
    color: t.yellow,
  },
  {
    name: "List Engagement",
    description: "Lists created, restaurants per list, list bookmark rate, tastemaker follow rate, list share clicks.",
    status: "planned",
    category: "Social",
    dataSource: "API events + PostHog",
    color: t.orange,
  },
  {
    name: "Image Interactions",
    description: "Photos uploaded per restaurant, like rate, report rate, average images viewed per session.",
    status: "planned",
    category: "Content",
    dataSource: "API events",
    color: t.cyan,
  },
  {
    name: "API Performance",
    description: "P50/P95/P99 response times, error rate by endpoint, Foursquare API latency, database query time.",
    status: "planned",
    category: "Performance",
    dataSource: "Laravel Telescope / APM",
    color: t.red,
  },
  {
    name: "Development Velocity",
    description: "Items shipped per session, bug fix rate, findings resolved, LOC delta per sprint.",
    status: "tracking",
    category: "Dev Ops",
    dataSource: "Git history + todos/ directory",
    color: t.accent,
  },
  {
    name: "Code Health Score",
    description: "Security findings open/closed, test coverage %, lint errors, TypeScript strict compliance.",
    status: "tracking",
    category: "Dev Ops",
    dataSource: "/roadmap health scorecard",
    color: t.green,
  },
  {
    name: "Click & Interaction Tracking",
    description: "CTA clicks, filter usage, map interactions, accordion expand/collapse, scroll depth.",
    status: "not-started",
    category: "UX",
    dataSource: "PostHog autocapture",
    color: t.dim,
  },
  {
    name: "Geolocation Usage",
    description: "Users granting location permission, nearby search frequency, average search radius, city distribution.",
    status: "not-started",
    category: "Core Feature",
    dataSource: "Browser Geolocation API + API logs",
    color: t.dim,
  },
  {
    name: "Push Notification Engagement",
    description: "FCM delivery rate, open rate by notification type, opt-in rate, time-to-open.",
    status: "not-started",
    category: "Engagement",
    dataSource: "Firebase Analytics",
    color: t.dim,
  },
];

const STATUS_COLORS: Record<MetricStatus, string> = {
  tracking: t.green,
  planned: t.yellow,
  "not-started": t.dim,
};

/* ─────────────────────────────────────────────
   Data — Key Questions
   ───────────────────────────────────────────── */

interface KeyQuestion {
  question: string;
  answer: string;
  metrics: string[];
  dataSource: string;
  priority: "high" | "medium" | "low";
}

const KEY_QUESTIONS: KeyQuestion[] = [
  {
    question: "Are users discovering restaurants or just browsing?",
    answer:
      "Measure search-to-save conversion rate. If users search but rarely save, the discovery UX needs work. Track Foursquare API calls vs restaurant_user inserts.",
    metrics: ["Search count", "Save rate", "Foursquare API calls"],
    dataSource: "API logs + restaurant_user table",
    priority: "high",
  },
  {
    question: "Which auth method converts best?",
    answer:
      "Compare signup completion rates across email, Google OAuth, and Apple Sign-In. Check 30-day retention by auth method — social logins often have higher activation but lower retention.",
    metrics: ["Signup funnel by method", "30-day retention", "Session frequency"],
    dataSource: "users table (user_type column) + Passport token logs",
    priority: "high",
  },
  {
    question: "Is the tagging system adding value?",
    answer:
      "Check tag creation rate and search-by-tag usage. If tags are created but rarely searched, they're not helping discovery. Compare search results click-through with vs without tag filters.",
    metrics: ["Tags per user", "Search-by-tag queries", "Tag filter CTR"],
    dataSource: "restaurant_tag pivot + API search logs",
    priority: "high",
  },
  {
    question: "Do tastemaker lists drive engagement?",
    answer:
      "Track list creation → follow → bookmark funnel. Measure if users who follow tastemakers have higher retention and session frequency than non-followers.",
    metrics: ["Lists created", "Follow rate", "Bookmark rate", "Retention delta"],
    dataSource: "testmaker_list + testmaker_follow tables",
    priority: "medium",
  },
  {
    question: "What's the real API performance under load?",
    answer:
      "The N+1 query issue in restaurantDetails means latency scales linearly with tastemaker count. Measure P95 response time now, fix the N+1, then re-measure. Target: <200ms for all endpoints.",
    metrics: ["P95 latency", "Queries per request", "Foursquare API time"],
    dataSource: "Laravel Telescope or custom middleware timing",
    priority: "medium",
  },
  {
    question: "Is the iOS app still the primary client?",
    answer:
      "Compare DAU across iOS, Android, and web. The iOS app has 617 commits and 25 screens — it's the most mature client. Web and Android are new. Track platform distribution over time.",
    metrics: ["DAU by platform", "Feature parity %", "API calls by client"],
    dataSource: "device_type column in users + API request User-Agent headers",
    priority: "medium",
  },
  {
    question: "How fast are we resolving security debt?",
    answer:
      "Track P1 findings open vs closed over time. Currently 15 P1 items open, 0 closed. Velocity here directly impacts production safety. Target: all P1 security items closed within 3 sessions.",
    metrics: ["P1 open count", "P1 close rate", "Days to resolution"],
    dataSource: "todos/ directory + git history",
    priority: "high",
  },
  {
    question: "What's the cost-per-feature of AI-assisted development?",
    answer:
      "Divide Claude Code API cost by features shipped. Compare human hours per feature vs traditional estimates. Track which tasks AI accelerates most (audit, boilerplate, docs) vs least (architecture decisions, security fixes).",
    metrics: ["API cost/session", "Human hours/feature", "AI acceleration factor"],
    dataSource: "Claude Code usage logs + session notes",
    priority: "low",
  },
];

const PRIORITY_COLORS: Record<KeyQuestion["priority"], string> = {
  high: t.red,
  medium: t.yellow,
  low: t.dim,
};

/* ─────────────────────────────────────────────
   Data — Analytics Platforms
   ───────────────────────────────────────────── */

interface Platform {
  name: string;
  description: string;
  status: "recommended" | "alternative" | "current";
  features: string[];
  color: string;
}

const PLATFORMS: Platform[] = [
  {
    name: "PostHog",
    description:
      "Open-source product analytics with autocapture, session replays, feature flags, and A/B testing. Self-hostable for full data control.",
    status: "recommended",
    features: [
      "Autocapture (no manual event code)",
      "Session replays",
      "Feature flags & A/B tests",
      "Funnels & retention charts",
      "Self-hostable (data privacy)",
      "Free tier: 1M events/mo",
    ],
    color: t.accent,
  },
  {
    name: "Mixpanel",
    description:
      "Event-based analytics focused on user behavior, funnels, and cohort analysis. Strong mobile SDK support.",
    status: "alternative",
    features: [
      "Event-based tracking",
      "Funnel & cohort analysis",
      "Mobile SDKs (iOS + Android)",
      "Real-time dashboards",
      "Free tier: 20M events/mo",
    ],
    color: t.purple,
  },
  {
    name: "Git + Todos (Current)",
    description:
      "Development velocity and code health are currently tracked via git history, todos/ directories, and the /roadmap health scorecard. No product analytics in production yet.",
    status: "current",
    features: [
      "Commit history & LOC tracking",
      "50 findings tracked in todos/",
      "Health scorecard on /roadmap",
      "Session velocity on /roadmap",
      "Manual — no automated collection",
    ],
    color: t.green,
  },
];

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function AnalyticsPage() {
  const trackingCount = PRODUCT_METRICS.filter(
    (m) => m.status === "tracking"
  ).length;
  const plannedCount = PRODUCT_METRICS.filter(
    (m) => m.status === "planned"
  ).length;
  const notStartedCount = PRODUCT_METRICS.filter(
    (m) => m.status === "not-started"
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: t.font,
      }}
    >
      {/* ── Sticky Header ── */}
      <header
        style={{
          borderBottom: `1px solid ${t.border}`,
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          position: "sticky",
          top: 0,
          background: `${t.bg}ee`,
          backdropFilter: "blur(12px)",
          zIndex: 10,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}
          >
            Analytics
          </h1>
          <p style={{ margin: "4px 0 0", color: t.muted, fontSize: 13 }}>
            Tastemakers &middot; Product Analytics Overview &middot;{" "}
            {trackingCount} tracking, {plannedCount} planned
          </p>
        </div>
        <nav style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
          {[
            { href: "/", label: "Home" },
            { href: "/tech", label: "Under the Hood" },
            { href: "/roadmap", label: "Roadmap" },
            { href: "/changelog", label: "Changelog" },
            { href: "/status", label: "Status" },
            { href: "/admin", label: "Admin" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{ color: t.accent, textDecoration: "none" }}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ── TOC ── */}
      <nav
        style={{
          padding: "16px 32px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 20px",
          fontSize: 12,
          fontFamily: t.mono,
        }}
      >
        {[
          ["velocity", "Velocity"],
          ["metrics", "Metrics"],
          ["questions", "Key Questions"],
          ["platform", "Platform"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            style={{ color: t.dim, textDecoration: "none" }}
          >
            {label}
          </a>
        ))}
      </nav>

      <main style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>
        {/* ── 01 Development Velocity ── */}
        <Section id="velocity" number="01" title="Development Velocity">
          <Card style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                gap: 32,
                flexWrap: "wrap",
                justifyContent: "center",
                marginBottom: 24,
                paddingBottom: 20,
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <StatBox
                value={String(VELOCITY_TOTAL)}
                label="Total Items"
                color={t.accent}
              />
              <StatBox
                value={String(VELOCITY_AVG)}
                label="Avg / Session"
                color={t.green}
              />
              <StatBox
                value={String(VELOCITY_PEAK.items)}
                label={`Peak (${VELOCITY_PEAK.session})`}
                color={t.yellow}
              />
              <StatBox
                value={`${VELOCITY_DATA.length}`}
                label="Sessions"
                color={t.purple}
              />
              <StatBox
                value={
                  VELOCITY_DATA.length >= 2
                    ? `${VELOCITY_DATA[VELOCITY_DATA.length - 1].items > VELOCITY_AVG ? "+" : ""}${VELOCITY_DATA[VELOCITY_DATA.length - 1].items - VELOCITY_AVG}`
                    : "—"
                }
                label="Last vs Avg"
                color={
                  VELOCITY_DATA[VELOCITY_DATA.length - 1].items >= VELOCITY_AVG
                    ? t.green
                    : t.red
                }
              />
            </div>

            {/* Bar chart */}
            {VELOCITY_DATA.map((entry) => (
              <div
                key={entry.session}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    width: 76,
                    fontSize: 12,
                    fontFamily: t.mono,
                    color: t.dim,
                    flexShrink: 0,
                  }}
                >
                  {entry.session}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 28,
                    background: t.border,
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${(entry.items / VELOCITY_MAX) * 100}%`,
                      height: "100%",
                      background: entry.color,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                      minWidth: 36,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: t.bg,
                        fontFamily: t.mono,
                      }}
                    >
                      {entry.items}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: t.muted,
                    width: 190,
                    flexShrink: 0,
                  }}
                >
                  {entry.label}
                </span>
              </div>
            ))}

            {/* Avg line legend */}
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${t.border}`,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: 12,
                color: t.dim,
              }}
            >
              <span>
                — Avg:{" "}
                <span
                  style={{ color: t.accent, fontFamily: t.mono, fontWeight: 600 }}
                >
                  {VELOCITY_AVG}
                </span>{" "}
                items/session
              </span>
              <span>
                — Peak:{" "}
                <span
                  style={{
                    color: t.yellow,
                    fontFamily: t.mono,
                    fontWeight: 600,
                  }}
                >
                  {VELOCITY_PEAK.items}
                </span>{" "}
                ({VELOCITY_PEAK.session})
              </span>
              <span>
                — Trend:{" "}
                <span
                  style={{
                    color: t.green,
                    fontFamily: t.mono,
                    fontWeight: 600,
                  }}
                >
                  Audit → Build
                </span>{" "}
                (shifted from findings to features after Session 4)
              </span>
            </div>
          </Card>

          {/* Breakdown by type */}
          <Card>
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 13,
                color: t.dim,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Breakdown by Contribution Type
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 12,
              }}
            >
              {(() => {
                const typeMap: Record<string, number> = {};
                VELOCITY_DATA.forEach((v) =>
                  v.breakdown.forEach((b) => {
                    typeMap[b.type] = (typeMap[b.type] || 0) + b.count;
                  })
                );
                return Object.entries(typeMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const colors: Record<string, string> = {
                      findings: t.yellow,
                      features: t.green,
                      docs: t.dim,
                      security: t.red,
                      performance: t.accent,
                      refactor: t.purple,
                    };
                    return (
                      <div
                        key={type}
                        style={{
                          textAlign: "center",
                          padding: "12px 8px",
                          borderRadius: 6,
                          background: `${colors[type] || t.dim}08`,
                          border: `1px solid ${colors[type] || t.dim}25`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            fontFamily: t.mono,
                            color: colors[type] || t.dim,
                          }}
                        >
                          {count}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: t.muted,
                            marginTop: 4,
                            textTransform: "capitalize",
                          }}
                        >
                          {type}
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </Card>
        </Section>

        {/* ── 02 Product Metrics Grid ── */}
        <Section id="metrics" number="02" title="Product Metrics">
          {/* Summary strip */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Tracking", count: trackingCount, color: t.green },
              { label: "Planned", count: plannedCount, color: t.yellow },
              {
                label: "Not Started",
                count: notStartedCount,
                color: t.dim,
              },
            ].map((s) => (
              <Badge key={s.label} color={s.color}>
                {s.count} {s.label}
              </Badge>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {PRODUCT_METRICS.map((metric) => (
              <Card
                key={metric.name}
                style={{
                  borderColor: `${metric.color}30`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontWeight: 700, fontSize: 14, color: t.text }}
                  >
                    {metric.name}
                  </span>
                  <Badge color={STATUS_COLORS[metric.status]}>
                    {metric.status}
                  </Badge>
                </div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 13,
                    color: t.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {metric.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 11,
                    color: t.dim,
                  }}
                >
                  <Badge color={t.dim}>{metric.category}</Badge>
                  <span style={{ fontFamily: t.mono }}>{metric.dataSource}</span>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        {/* ── 03 Key Questions ── */}
        <Section id="questions" number="03" title="Key Questions">
          <div style={{ display: "grid", gap: 12 }}>
            {KEY_QUESTIONS.map((q, i) => (
              <details
                key={i}
                style={{
                  background: t.surface,
                  borderRadius: 8,
                  border: `1px solid ${t.border}`,
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    padding: "16px 20px",
                    cursor: "pointer",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Badge color={PRIORITY_COLORS[q.priority]}>
                    {q.priority}
                  </Badge>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: t.text,
                      flex: 1,
                      minWidth: 200,
                    }}
                  >
                    {q.question}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: t.dim,
                      fontFamily: t.mono,
                    }}
                  >
                    {q.metrics.length} metrics
                  </span>
                </summary>
                <div style={{ padding: "0 20px 20px" }}>
                  <p
                    style={{
                      margin: "0 0 12px",
                      fontSize: 13,
                      color: t.muted,
                      lineHeight: 1.7,
                    }}
                  >
                    {q.answer}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    {q.metrics.map((m) => (
                      <Badge key={m} color={t.accent}>
                        {m}
                      </Badge>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: t.dim, fontFamily: t.mono }}>
                    Source: {q.dataSource}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* ── 04 Analytics Platform ── */}
        <Section id="platform" number="04" title="Analytics Platform">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {PLATFORMS.map((platform) => (
              <Card
                key={platform.name}
                style={{
                  borderColor:
                    platform.status === "recommended"
                      ? `${platform.color}50`
                      : t.border,
                  position: "relative",
                }}
              >
                {platform.status === "recommended" && (
                  <div
                    style={{
                      position: "absolute",
                      top: -1,
                      left: 20,
                      right: 20,
                      height: 2,
                      background: platform.color,
                      borderRadius: "0 0 2px 2px",
                    }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: platform.color,
                    }}
                  >
                    {platform.name}
                  </span>
                  <Badge
                    color={
                      platform.status === "recommended"
                        ? t.accent
                        : platform.status === "current"
                          ? t.green
                          : t.dim
                    }
                  >
                    {platform.status}
                  </Badge>
                </div>
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 13,
                    color: t.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {platform.description}
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 12,
                    color: t.dim,
                    lineHeight: 1.8,
                  }}
                >
                  {platform.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card style={{ marginTop: 16, textAlign: "center" }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 16,
                fontWeight: 700,
                color: t.text,
              }}
            >
              Ready to Instrument
            </h3>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                color: t.muted,
                maxWidth: 500,
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.6,
              }}
            >
              The codebase is structured for analytics — all user actions flow
              through typed API endpoints. Adding PostHog requires one{" "}
              <code
                style={{
                  fontFamily: t.mono,
                  fontSize: 12,
                  background: `${t.accent}15`,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                npm install posthog-js
              </code>{" "}
              and a provider wrapper in the root layout.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <a
                href="/roadmap"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 6,
                  background: `${t.accent}18`,
                  color: t.accent,
                  border: `1px solid ${t.accent}40`,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                View Roadmap
              </a>
              <a
                href="/tech"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  borderRadius: 6,
                  background: `${t.dim}18`,
                  color: t.muted,
                  border: `1px solid ${t.dim}40`,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Under the Hood
              </a>
            </div>
          </Card>
        </Section>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: `1px solid ${t.border}`,
          padding: "24px 32px",
          textAlign: "center",
          color: t.dim,
          fontSize: 12,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          {PRODUCT_METRICS.length} metrics defined &middot; {trackingCount}{" "}
          active &middot; {plannedCount} planned &middot; Data from git history
          and development logs
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <a
            href="/tech"
            style={{ color: t.accent, textDecoration: "none", fontSize: 12 }}
          >
            Under the Hood
          </a>
          <a
            href="/roadmap"
            style={{ color: t.accent, textDecoration: "none", fontSize: 12 }}
          >
            Roadmap
          </a>
          <a
            href="/changelog"
            style={{ color: t.accent, textDecoration: "none", fontSize: 12 }}
          >
            Changelog
          </a>
          <a
            href="/status"
            style={{ color: t.accent, textDecoration: "none", fontSize: 12 }}
          >
            Status
          </a>
          <a
            href="/"
            style={{ color: t.accent, textDecoration: "none", fontSize: 12 }}
          >
            Home
          </a>
        </div>
      </footer>
    </div>
  );
}
