"use client";

import { type ReactNode } from "react";

/* ─────────────────────────────────────────────
   Design tokens — shared with /tech and /roadmap
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
   Change type definitions
   ───────────────────────────────────────────── */

type ChangeType =
  | "feat"
  | "fix"
  | "perf"
  | "refactor"
  | "test"
  | "docs"
  | "security";

const CHANGE_TYPE_CONFIG: Record<
  ChangeType,
  { label: string; icon: string; color: string }
> = {
  feat: { label: "Feature", icon: "✦", color: t.green },
  fix: { label: "Fix", icon: "⚑", color: t.yellow },
  perf: { label: "Performance", icon: "⚡", color: t.accent },
  refactor: { label: "Refactor", icon: "↻", color: t.purple },
  test: { label: "Test", icon: "◉", color: t.cyan },
  docs: { label: "Docs", icon: "▤", color: t.dim },
  security: { label: "Security", icon: "⛨", color: t.red },
};

/* ─────────────────────────────────────────────
   Shared Components
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

function TypeBadge({ type }: { type: ChangeType }) {
  const cfg = CHANGE_TYPE_CONFIG[type];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: t.mono,
        background: `${cfg.color}18`,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
      }}
    >
      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
      {cfg.label}
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
    <div style={{ textAlign: "center", minWidth: 100 }}>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          fontFamily: t.mono,
          color,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Data — Releases
   ───────────────────────────────────────────── */

interface Change {
  type: ChangeType;
  description: string;
  scope?: string;
}

interface Release {
  version: string;
  date: string;
  session: string;
  title: string;
  highlights: [string, string, string];
  changes: Change[];
}

const RELEASES: Release[] = [
  {
    version: "v0.7.0",
    date: "2026-03-19",
    session: "Session 7",
    title: "Changelog, Roadmap Polish & Admin Scaffold",
    highlights: [
      "Built /changelog page with full release history and typed change entries",
      "Added admin layout with sidebar navigation linking /tech, /roadmap, /changelog",
      "Updated /tech page with Cost Comparison section and 11-section restructure",
    ],
    changes: [
      { type: "feat", description: "Built /changelog page with stats summary, release cards, and change type badges", scope: "web" },
      { type: "feat", description: "Created admin layout with sidebar navigation (Dashboard, Login, Under the Hood, Roadmap)", scope: "web" },
      { type: "feat", description: "Created admin login page with form calling POST /api/login", scope: "web" },
      { type: "refactor", description: "Restructured /tech page from 10 to 11 sections matching new spec", scope: "web" },
      { type: "feat", description: "Added Cost Comparison section — US dev shop vs offshore vs AI-assisted cost calculator", scope: "web" },
      { type: "feat", description: "Added Collapsible component for accordion behavior across all pages", scope: "web" },
      { type: "refactor", description: "Made all sections with >3 items collapsible (Feature Modules, Build Journal, Lessons)", scope: "web" },
      { type: "docs", description: "Added 2 new lessons learned (terminal-only dev, security debt compounds)", scope: "web" },
      { type: "feat", description: "AI Workflow section now uses 6-card grid layout instead of single card", scope: "web" },
      { type: "refactor", description: "Build Journal reordered to most-recent-first", scope: "web" },
    ],
  },
  {
    version: "v0.6.0",
    date: "2026-03-19",
    session: "Session 6",
    title: "Roadmap & Project Health Dashboard",
    highlights: [
      "Built /roadmap page with all 50 tracked findings organized by P1/P2/P3",
      "SVG score ring showing project health (3.8/10) with category breakdowns",
      "Product roadmap with 3-phase accordion (Short/Medium/Long term)",
    ],
    changes: [
      { type: "feat", description: "Built /roadmap page with 10 data-driven sections and cross-links to /tech", scope: "web" },
      { type: "feat", description: "SVG ScoreRing component with animated stroke-dasharray progress", scope: "web" },
      { type: "feat", description: "Health scorecard with 6 category breakdown bars (Architecture, Security, Testing, etc.)", scope: "web" },
      { type: "feat", description: "Product roadmap — 3-phase accordion with colored borders and status badges", scope: "web" },
      { type: "feat", description: "Session velocity horizontal bar chart showing items per session", scope: "web" },
      { type: "feat", description: "Next session planner with 5 priority-ordered security tasks", scope: "web" },
      { type: "feat", description: "Risk register collapsible table with impact/likelihood/mitigation columns", scope: "web" },
      { type: "feat", description: "Audit recommendations — 15 prioritized action items from code reviews", scope: "web" },
      { type: "feat", description: "Findings pattern analysis with category breakdown bars and key insights", scope: "web" },
      { type: "feat", description: "Overall progress multi-segment bar (P1 red, P2 yellow, P3 purple, completed green)", scope: "web" },
      { type: "feat", description: "All 50 findings rendered as FindingCard components with ID, tags, dates, file paths", scope: "web" },
      { type: "feat", description: "Tooling & Workflow section: Available (5), Planned (4), Missing (4)", scope: "web" },
    ],
  },
  {
    version: "v0.5.0",
    date: "2026-03-13",
    session: "Session 6",
    title: "Under the Hood — Technical Overview Page",
    highlights: [
      "Built /tech page with Mermaid.js architecture diagram and 3 ERD schemas",
      "10-section data-driven page: genesis, AI workflow, stats, stack, schema, journal",
      "Inline design system with dark dev-tool aesthetic and reusable components",
    ],
    changes: [
      { type: "feat", description: "Built /tech page — 1,085 lines of data-driven React with 10 sections", scope: "web" },
      { type: "feat", description: "MermaidDiagram component loading Mermaid.js v11 from CDN via dynamic import", scope: "web" },
      { type: "feat", description: "Architecture flowchart showing all 4 clients, API layer, data layer, external services", scope: "web" },
      { type: "feat", description: "3 collapsible ERD diagrams: Core (users/restaurants/tags), Categories, Access Control", scope: "web" },
      { type: "feat", description: "By the Numbers stats grid with LOC bar chart by project", scope: "web" },
      { type: "feat", description: "Build Journal timeline with dot indicators and type-colored badges", scope: "web" },
      { type: "feat", description: "Design tokens object (t) with 14 color tokens, 2 font stacks", scope: "web" },
      { type: "feat", description: "Reusable Section, Card, StatBox, Badge components with inline CSS", scope: "web" },
      { type: "docs", description: "Lessons Learned section with 5 insights about AI-assisted development", scope: "web" },
    ],
  },
  {
    version: "v0.4.0",
    date: "2026-03-13",
    session: "Session 5",
    title: "Android Assessment & Platform Audit",
    highlights: [
      "Discovered Android app won't compile — missing Hilt module + Firebase config",
      "Identified premature Phase 3–5 dependencies blocking scaffold stage",
      "Documented 2 cross-project P2 findings for Android",
    ],
    changes: [
      { type: "security", description: "Found allowBackup=\"true\" in Android manifest — enables ADB data extraction", scope: "android" },
      { type: "docs", description: "Documented missing Hilt DI module preventing Android compilation", scope: "android" },
      { type: "docs", description: "Documented premature Firebase/Play Services dependencies (no google-services.json)", scope: "android" },
      { type: "docs", description: "Logged Android user_id in requests codifying IDOR vulnerability", scope: "android" },
      { type: "docs", description: "Noted Android Restaurant model missing city/country fields from backend", scope: "android" },
    ],
  },
  {
    version: "v0.3.0",
    date: "2026-03-13",
    session: "Session 4",
    title: "Security Audit — Critical Vulnerabilities Found",
    highlights: [
      "Found 10 P1 critical security issues including secrets in git and IDOR",
      "Unauthenticated delete endpoints, broken Apple JWT, debug credential leaks",
      "Documented all findings in tastemakers-backend/todos/ with acceptance criteria",
    ],
    changes: [
      { type: "security", description: "Found .env_bkp with production DB password, API keys, Laravel APP_KEY in git", scope: "backend" },
      { type: "security", description: "Found unauthenticated image-delete, tags-delete, tastemakerlist-delete endpoints", scope: "backend" },
      { type: "security", description: "Found hardcoded Firebase FCM server key and Google OAuth client ID in source", scope: "backend" },
      { type: "security", description: "Found broken Apple Sign-In — JWT signature never verified against JWKS", scope: "backend" },
      { type: "security", description: "Found debug echo/print_r leaking Foursquare API URL with credentials", scope: "backend" },
      { type: "security", description: "Found public /clear-cache route running 5 artisan commands without auth", scope: "backend" },
      { type: "security", description: "Found IDOR — user_id accepted from request body in 4+ endpoints", scope: "backend" },
      { type: "security", description: "Found Google/Apple OAuth storing raw token as unhashed password", scope: "backend" },
      { type: "security", description: "Found wp-config.php with production MySQL password and auth salts exposed", scope: "wordpress" },
      { type: "security", description: "Found SSL verification disabled for FCM push notification requests", scope: "backend" },
      { type: "perf", description: "Found env() called 12+ times in controllers — breaks after config:cache", scope: "backend" },
    ],
  },
  {
    version: "v0.2.0",
    date: "2026-03-13",
    session: "Session 3",
    title: "Cross-Platform API Contract Mapping",
    highlights: [
      "Mapped every API endpoint across iOS, Android, and web clients",
      "Found field name mismatches (tag_name vs name, description vs short_description)",
      "Documented 19 cross-project findings in todos/ directory",
    ],
    changes: [
      { type: "refactor", description: "Mapped all 50 API endpoints across iOS, Android, Web, and backend documentation", scope: "cross-project" },
      { type: "fix", description: "Identified tag 'name' vs 'tag_name' mismatch — tags deserialize as null in clients", scope: "cross-project" },
      { type: "fix", description: "Identified user 'short_description' vs 'description' mismatch — bios fail to save", scope: "cross-project" },
      { type: "fix", description: "Found search-tags endpoint divergence — iOS calls different controller than docs specify", scope: "cross-project" },
      { type: "docs", description: "Created 19 cross-project todo files with priority, scope, file paths, acceptance criteria", scope: "cross-project" },
      { type: "docs", description: "Found 5 different brand name spellings (tastemaker, testmaker, testsmaker, testemakers, TasteMaker)", scope: "cross-project" },
      { type: "fix", description: "Identified TypeScript types missing API response envelope wrappers", scope: "web" },
      { type: "security", description: "Identified localStorage token XSS vulnerability — needs httpOnly cookie upgrade", scope: "web" },
      { type: "docs", description: "Identified incomplete root CLAUDE.md API contract (missing 11+ endpoints)", scope: "docs" },
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-03-13",
    session: "Session 2",
    title: "Web Frontend Scaffold",
    highlights: [
      "Created Next.js 15 + TypeScript web frontend on port 3050",
      "API proxy to Laravel backend (localhost:4050) via next.config.ts rewrites",
      "TypeScript interfaces for User, Restaurant, Tag, TastemakerList",
    ],
    changes: [
      { type: "feat", description: "Scaffolded tastemakers-web with Next.js 15 App Router and React 19", scope: "web" },
      { type: "feat", description: "Configured TypeScript strict mode with path aliases (@/* → ./src/*)", scope: "web" },
      { type: "feat", description: "Set up API proxy rewrites: /api/* → localhost:4050/api/*", scope: "web" },
      { type: "feat", description: "Created apiFetch<T>() helper with auto Bearer token injection", scope: "web" },
      { type: "feat", description: "Defined TypeScript interfaces: User, Restaurant, Tag, TastemakerList", scope: "web" },
      { type: "docs", description: "Created CLAUDE.md for web project with setup, structure, and 7-phase implementation plan", scope: "web" },
      { type: "docs", description: "Established port assignments: 3050 web, 4050 API, 4051 admin, 5446 PG, 6384 Redis", scope: "infrastructure" },
    ],
  },
  {
    version: "v0.0.1",
    date: "2026-03-13",
    session: "Session 1",
    title: "Backend Audit & Project Documentation",
    highlights: [
      "Read every controller, model, and migration in the Laravel backend",
      "Documented 31 backend findings and set up CLAUDE.md for all 5 repos",
      "Established todos/ tracking system for cross-project code review findings",
    ],
    changes: [
      { type: "docs", description: "Read and audited all 11 controllers (6,358 LOC), 9 models, 17 migrations", scope: "backend" },
      { type: "docs", description: "Documented 31 backend-specific findings in tastemakers-backend/todos/", scope: "backend" },
      { type: "docs", description: "Created CLAUDE.md context files for all 5 repositories + monorepo root", scope: "all" },
      { type: "docs", description: "Established todos/ directory structure with README index and per-issue markdown files", scope: "all" },
      { type: "perf", description: "Found N+1 query catastrophe — 600+ queries for 100 tastemakers in restaurantDetails", scope: "backend" },
      { type: "perf", description: "Found missing database indexes on all 3 pivot table FK columns", scope: "backend" },
      { type: "refactor", description: "Identified god controllers: RestaurantController (2,985 LOC), UserController (1,623 LOC)", scope: "backend" },
      { type: "docs", description: "Documented Haversine formula duplicated 16 times in RestaurantController", scope: "backend" },
      { type: "docs", description: "Found 390+ lines of commented-out code (13% of RestaurantController)", scope: "backend" },
      { type: "docs", description: "Identified permission checking copy-pasted 51 times across 7 controllers", scope: "backend" },
      { type: "refactor", description: "Mapped 3 inconsistent API response formats across all controllers", scope: "backend" },
    ],
  },
  {
    version: "Legacy",
    date: "2021–2025",
    session: "Pre-audit",
    title: "Original iOS App Development (617 commits)",
    highlights: [
      "iOS app built over 4+ years with 25 ViewControllers and 617 git commits",
      "Features: restaurant discovery, tagging, lists, social login, badge system",
      "Laravel 8 backend API with PostgreSQL, Passport OAuth2, Foursquare integration",
    ],
    changes: [
      { type: "feat", description: "Built iOS app with 25 ViewControllers: auth, restaurant discovery, tagging, lists, profiles", scope: "ios" },
      { type: "feat", description: "Implemented Google OAuth and Apple Sign-In for iOS social login", scope: "ios" },
      { type: "feat", description: "Built restaurant image upload, like/unlike, and reporting system", scope: "ios" },
      { type: "feat", description: "Implemented Foursquare venue search integration for restaurant discovery", scope: "backend" },
      { type: "feat", description: "Built tastemaker list curation and follow/bookmark system", scope: "backend" },
      { type: "feat", description: "Implemented badge system (Sous-Chef, Head-Chef, Iron-Chef, Michelin-Star)", scope: "ios" },
      { type: "feat", description: "Built admin panel with Blade templates, DataTables, and RBAC", scope: "backend" },
      { type: "feat", description: "Configured Laravel Passport OAuth2 for Bearer token authentication", scope: "backend" },
      { type: "feat", description: "Built category system with bulk Excel import (Maatwebsite/Excel)", scope: "backend" },
      { type: "feat", description: "Implemented geolocation search with Haversine distance formula", scope: "backend" },
      { type: "feat", description: "Built WordPress marketing site at tastemakersapp.com", scope: "wordpress" },
      { type: "feat", description: "Set up PostgreSQL database with 15 tables and 5 pivot tables", scope: "backend" },
      { type: "feat", description: "Implemented Firebase FCM push notifications for iOS", scope: "backend" },
      { type: "fix", description: "Google login crash fixed (iOS 17 support update, Nov 2023)", scope: "ios" },
      { type: "refactor", description: "Updated CocoaPods and removed deprecated methods (Jan 2023)", scope: "ios" },
      { type: "feat", description: "Scaffolded Android app with Kotlin + Jetpack Compose (early stage, 135 LOC)", scope: "android" },
    ],
  },
];

/* ─────────────────────────────────────────────
   Computed stats
   ───────────────────────────────────────────── */

const TOTAL_RELEASES = RELEASES.length;
const TOTAL_CHANGES = RELEASES.reduce((sum, r) => sum + r.changes.length, 0);
const TOTAL_SESSIONS = new Set(RELEASES.map((r) => r.session)).size;

const TYPE_COUNTS: { type: ChangeType; count: number }[] = (
  Object.keys(CHANGE_TYPE_CONFIG) as ChangeType[]
)
  .map((type) => ({
    type,
    count: RELEASES.reduce(
      (sum, r) => sum + r.changes.filter((c) => c.type === type).length,
      0
    ),
  }))
  .filter((t) => t.count > 0)
  .sort((a, b) => b.count - a.count);

const MAX_TYPE_COUNT = Math.max(...TYPE_COUNTS.map((t) => t.count));

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function ChangelogPage() {
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
            Changelog
          </h1>
          <p style={{ margin: "4px 0 0", color: t.muted, fontSize: 13 }}>
            Tastemakers &middot; Release History &middot; {TOTAL_CHANGES}{" "}
            changes across {TOTAL_RELEASES} releases
          </p>
        </div>
        <nav style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
          {[
            { href: "/", label: "Home" },
            { href: "/tech", label: "Under the Hood" },
            { href: "/roadmap", label: "Roadmap" },
            { href: "/status", label: "Status" },
            { href: "/analytics", label: "Analytics" },
            { href: "/admin", label: "Admin" },
          ].map((link) => (
            <a key={link.href} href={link.href} style={{ color: t.accent, textDecoration: "none" }}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <main style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>
        {/* ── Stats Summary ── */}
        <Card style={{ marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              gap: 32,
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <StatBox
              value={String(TOTAL_RELEASES)}
              label="Releases"
              color={t.accent}
            />
            <StatBox
              value={String(TOTAL_CHANGES)}
              label="Total Changes"
              color={t.green}
            />
            <StatBox
              value={String(TOTAL_SESSIONS)}
              label="Sessions"
              color={t.purple}
            />
            <StatBox value="624" label="Git Commits" color={t.yellow} />
            <StatBox value="5" label="Repositories" color={t.orange} />
          </div>

          {/* Change type breakdown */}
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              color: t.dim,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Changes by Type
          </h3>
          <div>
            {TYPE_COUNTS.map((tc) => {
              const cfg = CHANGE_TYPE_CONFIG[tc.type];
              return (
                <div
                  key={tc.type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      width: 90,
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    <span style={{ color: t.muted }}>{cfg.label}</span>
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 18,
                      background: t.border,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(tc.count / MAX_TYPE_COUNT) * 100}%`,
                        height: "100%",
                        background: cfg.color,
                        borderRadius: 4,
                        minWidth: 20,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: t.bg,
                          fontFamily: t.mono,
                        }}
                      >
                        {tc.count}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Release Cards ── */}
        {RELEASES.map((release) => (
          <details
            key={release.version}
            open={release.version === "v0.7.0" || undefined}
            style={{
              marginBottom: 16,
              background: t.surface,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
              overflow: "hidden",
            }}
          >
            <summary
              style={{
                padding: "20px 24px",
                cursor: "pointer",
                listStyle: "none",
              }}
            >
              {/* Version + date row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontFamily: t.mono,
                    fontSize: 18,
                    fontWeight: 700,
                    color: t.accent,
                  }}
                >
                  {release.version}
                </span>
                <span
                  style={{
                    fontFamily: t.mono,
                    fontSize: 12,
                    color: t.dim,
                  }}
                >
                  {release.date}
                </span>
                <Badge color={t.purple}>{release.session}</Badge>
                <Badge color={t.muted}>
                  {release.changes.length} changes
                </Badge>
              </div>

              {/* Title */}
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 16,
                  fontWeight: 700,
                  color: t.text,
                }}
              >
                {release.title}
              </h3>

              {/* 3 Highlights — always visible */}
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  fontSize: 13,
                  color: t.muted,
                  lineHeight: 1.8,
                }}
              >
                {release.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </summary>

            {/* Expanded: individual changes */}
            <div
              style={{
                padding: "0 24px 20px",
                borderTop: `1px solid ${t.border}`,
              }}
            >
              <h4
                style={{
                  margin: "16px 0 12px",
                  fontSize: 12,
                  color: t.dim,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontFamily: t.mono,
                }}
              >
                All Changes
              </h4>
              {release.changes.map((change, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom:
                      i < release.changes.length - 1
                        ? `1px solid ${t.border}`
                        : "none",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <TypeBadge type={change.type} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: t.text,
                      lineHeight: 1.5,
                      minWidth: 200,
                    }}
                  >
                    {change.description}
                  </span>
                  {change.scope && (
                    <Badge color={t.dim}>{change.scope}</Badge>
                  )}
                </div>
              ))}
            </div>
          </details>
        ))}
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
          {TOTAL_RELEASES} releases · {TOTAL_CHANGES} changes · Data sourced
          from git history and development session logs
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
