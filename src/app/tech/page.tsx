"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ─────────────────────────────────────────────
   Design tokens — matches dark dev-tool aesthetic
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
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace',
};

/* ─────────────────────────────────────────────
   Mermaid Diagrams
   ───────────────────────────────────────────── */

const ARCHITECTURE_DIAGRAM = `flowchart TB
    subgraph Clients["Clients"]
        iOS["iOS App<br/><small>Swift · UIKit</small>"]
        Android["Android App<br/><small>Kotlin · Compose</small>"]
        Web["Web App<br/><small>Next.js 15 · TypeScript</small>"]
        WP["Marketing Site<br/><small>WordPress</small>"]
    end

    subgraph API["Laravel 8 API · Port 4050"]
        Passport["Laravel Passport<br/><small>OAuth2 Tokens</small>"]
        Controllers["Controllers<br/><small>11 controllers · 50 routes</small>"]
        Models["Eloquent Models<br/><small>9 models</small>"]
        Mail["Laravel Mail<br/><small>SMTP</small>"]
    end

    subgraph Data["Data Layer"]
        PG["PostgreSQL<br/><small>Port 5446</small>"]
        Redis["Redis<br/><small>Port 6384</small>"]
        Storage["Local Storage<br/><small>Images / Uploads</small>"]
    end

    subgraph External["External Services"]
        Foursquare["Foursquare API<br/><small>Venue Search</small>"]
        FCM["Firebase FCM<br/><small>Push Notifications</small>"]
        Google["Google OAuth<br/><small>Social Login</small>"]
        Apple["Apple Sign-In<br/><small>JWT Auth</small>"]
    end

    iOS -->|"Bearer Token"| Passport
    Android -->|"Bearer Token"| Passport
    Web -->|"Proxy :3050 → :4050"| Passport
    Passport --> Controllers
    Controllers --> Models
    Models --> PG
    Controllers --> Redis
    Controllers --> Storage
    Controllers -->|"cURL"| Foursquare
    Controllers -->|"cURL"| FCM
    Controllers --> Mail
    iOS -.->|"OAuth"| Google
    iOS -.->|"JWT"| Apple
`;

const ERD_CORE = `erDiagram
    users {
        bigint id PK
        string first_name
        string last_name
        string image
        string email UK
        string password
        string user_type
        integer role_id FK
        string fcm_token
        string device_type
        timestamp deleted_at
    }
    restaurants {
        bigint id PK
        string place_id UK
        string name
        string website
        string contact
        string address
        string lat
        string lng
        bigint country_id FK
        timestamp deleted_at
    }
    tags {
        bigint id PK
        string name
        timestamp deleted_at
    }
    countries {
        bigint id PK
        string name
        timestamp deleted_at
    }
    restaurant_tag {
        bigint id PK
        bigint restaurant_id FK
        bigint tag_id FK
        bigint user_id FK
    }
    restaurant_user {
        bigint id PK
        bigint restaurant_id FK
        bigint user_id FK
    }

    users ||--o{ restaurant_tag : "tags"
    users ||--o{ restaurant_user : "saves"
    restaurants ||--o{ restaurant_tag : "tagged by"
    restaurants ||--o{ restaurant_user : "saved by"
    restaurants }o--|| countries : "located in"
    tags ||--o{ restaurant_tag : "applied to"
`;

const ERD_CATEGORIES = `erDiagram
    categories {
        bigint id PK
        string category_id UK
        string title
    }
    pre_define_tags {
        bigint id PK
        string name
    }
    category_pre_define_tag {
        bigint id PK
        bigint category_id FK
        bigint pre_define_tag_id FK
    }
    category_restaurant {
        bigint id PK
        bigint category_id FK
        bigint restaurant_id FK
    }

    categories ||--o{ category_pre_define_tag : "has tags"
    categories ||--o{ category_restaurant : "has restaurants"
    pre_define_tags ||--o{ category_pre_define_tag : "in category"
`;

const ERD_ACCESS = `erDiagram
    roles {
        bigint id PK
        string name
    }
    modules {
        bigint id PK
        string name
    }
    module_role {
        bigint id PK
        bigint module_id FK
        bigint role_id FK
        boolean view
        boolean add
        boolean edit
        boolean delete
    }

    roles ||--o{ module_role : "has permissions"
    modules ||--o{ module_role : "granted to"
`;

/* ─────────────────────────────────────────────
   Shared Components
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
  style: extraStyle,
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
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

function StatBox({
  value,
  label,
  icon,
  color = t.accent,
}: {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 100 }}>
      {icon && <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>}
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
        fontSize: 12,
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

function Collapsible({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen || undefined}
      style={{
        marginBottom: 12,
        background: t.surface,
        borderRadius: 8,
        border: `1px solid ${t.border}`,
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          padding: "14px 20px",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: t.text,
          listStyle: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{title}</span>
        {subtitle && (
          <span style={{ fontSize: 12, color: t.dim, fontWeight: 400 }}>
            {subtitle}
          </span>
        )}
      </summary>
      <div style={{ padding: "0 20px 20px" }}>{children}</div>
    </details>
  );
}

function MermaidDiagram({
  id,
  chart,
  maxWidth,
}: {
  id: string;
  chart: string;
  maxWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = await import(
          /* webpackIgnore: true */
          "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
        );
        if (cancelled) return;

        mermaid.default.initialize({
          startOnLoad: false,
          theme: "dark",
          er: { useMaxWidth: false },
          flowchart: { useMaxWidth: false, curve: "basis" },
          themeVariables: {
            darkMode: true,
            background: t.surface,
            primaryColor: "#4f46e5",
            primaryTextColor: t.text,
            lineColor: t.accent,
            secondaryColor: "#1e1e3f",
            tertiaryColor: "#2a2a4a",
            fontSize: "13px",
          },
        });

        const { svg } = await mermaid.default.render(id, chart);
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        setLoaded(true);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [id, chart]);

  return (
    <div
      style={{
        overflow: "auto",
        padding: 16,
        background: t.surface,
        borderRadius: 8,
        border: `1px solid ${t.border}`,
      }}
    >
      {!loaded && !error && (
        <p style={{ color: t.muted, textAlign: "center", padding: 32 }}>
          Loading diagram...
        </p>
      )}
      {error && (
        <p style={{ color: t.red, textAlign: "center", padding: 32 }}>
          {error}
        </p>
      )}
      <div
        ref={ref}
        style={{
          display: "flex",
          justifyContent: "center",
          maxWidth: maxWidth ?? undefined,
          margin: "0 auto",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Data — All sections driven by typed arrays
   ───────────────────────────────────────────── */

const STATS: { value: string; label: string; icon: string; color: string }[] = [
  { value: "~69K", label: "Lines of Code", icon: "📝", color: t.accent },
  { value: "624", label: "Git Commits", icon: "📦", color: t.green },
  { value: "50", label: "API Endpoints", icon: "🔌", color: t.purple },
  { value: "15", label: "DB Tables", icon: "🗄️", color: t.yellow },
  { value: "9", label: "Eloquent Models", icon: "📊", color: t.orange },
  { value: "11", label: "Controllers", icon: "🎛️", color: t.red },
  { value: "17", label: "Migrations", icon: "📋", color: t.accent },
  { value: "25", label: "iOS Screens", icon: "📱", color: t.green },
  { value: "5", label: "Repositories", icon: "📁", color: t.purple },
  { value: "50+", label: "Tracked Issues", icon: "🐛", color: t.yellow },
  { value: "16", label: "Dependencies", icon: "📦", color: t.orange },
  { value: "4", label: "Client Platforms", icon: "🖥️", color: t.red },
];

const LOC_BY_PROJECT: { name: string; loc: number; color: string }[] = [
  { name: "WordPress (PHP)", loc: 32893, color: t.muted },
  { name: "iOS (Swift)", loc: 17795, color: t.green },
  { name: "Backend (PHP)", loc: 17592, color: t.purple },
  { name: "Web (TS/TSX)", loc: 1100, color: t.accent },
  { name: "Android (Kotlin)", loc: 135, color: t.orange },
];

const COST_COMPARISON: {
  tier: string;
  label: string;
  rateRange: string;
  hoursLow: number;
  hoursHigh: number;
  color: string;
  notes: string;
}[] = [
  {
    tier: "US Dev Shop",
    label: "Senior full-stack team in SF/NYC",
    rateRange: "$150–250/hr",
    hoursLow: 2000,
    hoursHigh: 3200,
    color: t.red,
    notes: "Includes PM overhead, design sprints, QA cycles, standups",
  },
  {
    tier: "Offshore (India/China)",
    label: "Outsourced development team",
    rateRange: "$25–60/hr",
    hoursLow: 2400,
    hoursHigh: 4000,
    color: t.yellow,
    notes: "Higher hours due to communication overhead and iteration cycles",
  },
  {
    tier: "AI-Assisted (Actual)",
    label: "Solo developer + Claude Code",
    rateRange: "~$20/mo (API)",
    hoursLow: 80,
    hoursHigh: 200,
    color: t.green,
    notes: "Human hours only — AI handles boilerplate, auditing, refactoring",
  },
];

const COST_SCOPE: string[] = [
  "Laravel 8 API with OAuth2 auth, 50 endpoints, 9 models, RBAC admin",
  "iOS app — 25 screens, Google/Apple social login, geolocation, image uploads",
  "Android app — Kotlin/Compose scaffold (early stage)",
  "Next.js 15 web frontend with TypeScript strict mode",
  "WordPress marketing site with custom theme",
  "PostgreSQL schema design, Redis caching, Foursquare/FCM integrations",
  "Cross-platform API contract coordination across 3 mobile clients",
  "Security audit, code review, and 50+ issue tracking/documentation",
];

const AI_WORKFLOW: { title: string; description: string }[] = [
  {
    title: "CLAUDE.md as Cross-Session Memory",
    description:
      "6 CLAUDE.md files across the monorepo — one per project plus the root. They document the API contract, port registry, implementation plans, and 50+ tracked issues. Claude Code reads these on every session start, so each conversation begins with full project context.",
  },
  {
    title: "Session Structure",
    description:
      "Each session begins with Claude Code reading context files, then the human sets the goal. Exploration first (read, audit, document), then targeted changes. No autonomous large-scale refactors without human review.",
  },
  {
    title: "Feedback Loops",
    description:
      "Direct exploration ('read every controller and list security issues'), review findings, then approve or redirect specific changes. Claude Code proposes diffs, each is reviewed before accepting. Findings are captured in todos/ for cross-session persistence.",
  },
  {
    title: "Human vs AI Responsibilities",
    description:
      "Delegated to AI: reading and auditing code, generating boilerplate, finding inconsistencies across repos, writing documentation. Directed by human: architecture decisions, security fixes, API contract changes, anything that touches production.",
  },
  {
    title: "Terminal-Only Development",
    description:
      "Built entirely via Claude Code CLI in the terminal — no IDE GUI, no drag-and-drop, no visual editor. Every file is created and edited through text commands. This /tech page's 1000+ lines of inline-styled React was written without previewing in a browser.",
  },
  {
    title: "Documentation-First Strategy",
    description:
      "Spent the first two sessions reading and documenting the existing codebase instead of writing new code. This surfaced 50 issues including critical security vulnerabilities — saving weeks of building on a broken foundation.",
  },
];

const TECH_STACK: {
  category: string;
  items: { name: string; detail: string }[];
}[] = [
  {
    category: "Frontend",
    items: [
      { name: "Next.js 15", detail: "App Router, React Server Components" },
      { name: "TypeScript", detail: "Strict mode, path aliases" },
      { name: "React 19", detail: "Client + Server Components" },
    ],
  },
  {
    category: "Mobile",
    items: [
      {
        name: "Swift / UIKit",
        detail: "iOS — 25 ViewControllers, 617 commits",
      },
      { name: "Kotlin / Jetpack Compose", detail: "Android — early stage" },
    ],
  },
  {
    category: "Backend",
    items: [
      { name: "Laravel 8", detail: "PHP 7.3/8.0, Eloquent ORM" },
      { name: "Laravel Passport", detail: "OAuth2 token auth for mobile" },
      { name: "Maatwebsite/Excel", detail: "Bulk category imports" },
      { name: "Yajra DataTables", detail: "Admin panel data grids" },
    ],
  },
  {
    category: "Database & Auth",
    items: [
      { name: "PostgreSQL", detail: "Primary database, port 5446" },
      { name: "Redis", detail: "Cache layer, port 6384" },
      { name: "OAuth2 (Passport)", detail: "Bearer token authentication" },
      { name: "Google OAuth", detail: "Social login" },
      { name: "Apple Sign-In", detail: "iOS JWT authentication" },
    ],
  },
  {
    category: "Data & Integrations",
    items: [
      { name: "Foursquare API", detail: "Venue search, restaurant data" },
      { name: "Firebase FCM", detail: "Push notifications to mobile" },
      { name: "SMTP", detail: "Welcome emails, password resets" },
      { name: "Google Maps", detail: "Geocoding, place details" },
    ],
  },
  {
    category: "Testing & Quality",
    items: [
      { name: "PHPUnit", detail: "Backend unit/feature tests" },
      { name: "ESLint", detail: "TypeScript/React linting" },
      { name: "TypeScript Strict", detail: "Compile-time type safety" },
    ],
  },
  {
    category: "Infrastructure",
    items: [
      { name: "WordPress", detail: "Marketing site — tastemakersapp.com" },
      { name: "Local Storage", detail: "Image uploads (profile, restaurant)" },
      { name: "Mermaid.js", detail: "Architecture & ERD diagrams (this page)" },
    ],
  },
];

const FEATURE_MODULES: { name: string; desc: string }[] = [
  {
    name: "Authentication",
    desc: "Email/password, Google OAuth, Apple Sign-In, device registration, password reset with OTP",
  },
  {
    name: "User Profiles",
    desc: "Profile CRUD, avatars, badges, login tracking, notification preferences",
  },
  {
    name: "Restaurant Discovery",
    desc: "Foursquare-powered search, geolocation, Haversine distance, saved restaurants",
  },
  {
    name: "Tagging System",
    desc: "User-created tags applied to restaurants — 3-way pivot (user × restaurant × tag)",
  },
  {
    name: "Tastemaker Lists",
    desc: "Curated restaurant lists, follow tastemakers, bookmark lists",
  },
  {
    name: "Restaurant Images",
    desc: "Upload, view, like/unlike photos, report inappropriate content",
  },
  {
    name: "Categories",
    desc: "Predefined cuisine categories with tag groupings, bulk Excel import",
  },
  {
    name: "Admin Panel",
    desc: "Dashboard, user/restaurant/tag CRUD, role-based access control (RBAC)",
  },
  {
    name: "Social Features",
    desc: "Follow tastemakers, like images, bookmark lists, activity feeds",
  },
  {
    name: "Geolocation",
    desc: "Nearby restaurants, cuisine-based search by coordinates",
  },
];

const BUILD_JOURNAL: {
  date: string;
  title: string;
  details: string;
  type: "feature" | "fix" | "refactor" | "setup" | "mistake";
}[] = [
  {
    date: "Session 6",
    title: "/tech page — full technical overview",
    details:
      "Built the Under the Hood page with 11 data-driven sections, Mermaid.js architecture diagrams, cost comparison calculator, collapsible ERD schemas, and build timeline. All inline-styled, no Tailwind dependency.",
    type: "feature",
  },
  {
    date: "Session 5",
    title: "Android project assessment",
    details:
      "Discovered Android won't compile — missing Hilt dependency injection module, premature Firebase dependencies without google-services.json. Only 135 LOC, 1 commit. Marked as P2.",
    type: "mistake",
  },
  {
    date: "Session 4",
    title: "Security audit findings",
    details:
      "Found production secrets in git, unauthenticated delete endpoints, hardcoded FCM server key, IDOR vulnerabilities (user_id from request body instead of Auth::id()), SSL verification disabled on cURL calls, public /clear-cache route running artisan commands.",
    type: "mistake",
  },
  {
    date: "Session 3",
    title: "Cross-platform API contract mapping",
    details:
      "Mapped every API endpoint across iOS, Android, and web. Found field name mismatches (tag_name vs name, description vs short_description) and endpoint divergence between iOS and API docs. Documented in P1 todos.",
    type: "refactor",
  },
  {
    date: "Session 2",
    title: "Web frontend scaffold",
    details:
      "Created tastemakers-web with Next.js 15, TypeScript strict mode, API proxy config. Established port assignments (3050 web, 4050 API) to avoid collisions across 5 projects on one machine.",
    type: "feature",
  },
  {
    date: "Session 1",
    title: "Backend API audit & CLAUDE.md setup",
    details:
      "Read every controller, model, and migration. Documented 31 backend findings and 19 cross-project issues in todos/. Set up CLAUDE.md files for each repo so Claude Code has persistent context across sessions.",
    type: "setup",
  },
];

const LESSONS: { label: string; text: string; type: "worked" | "hard" }[] = [
  {
    label: "CLAUDE.md is the killer feature",
    text: "Writing project context into CLAUDE.md files means each new Claude Code session starts with full awareness of ports, conventions, known bugs, and cross-project dependencies. Without this, every session would start from zero.",
    type: "worked",
  },
  {
    label: "Audit before building",
    text: "Spending the first sessions reading and documenting the existing codebase (instead of writing new code) surfaced 50 issues including critical security vulnerabilities. This saved weeks of building on a broken foundation.",
    type: "worked",
  },
  {
    label: "Cross-project coordination is the hard part",
    text: "The API contract between 3 mobile clients and a backend had drifted. Field names, response envelopes, and endpoint paths all had subtle differences. AI can find these inconsistencies fast, but fixing them requires coordinated changes across repos.",
    type: "hard",
  },
  {
    label: "God controllers resist refactoring",
    text: "RestaurantController is 2,985 lines with 35+ public methods. Every change risks breaking something else. AI suggests clean extractions but each one requires tracing dependencies through the entire monolith.",
    type: "hard",
  },
  {
    label: "Let AI explore, human decides",
    text: "The best workflow: tell Claude Code to read and analyze, review its findings, then direct specific changes. Letting it make autonomous large-scale changes without review leads to subtle regressions.",
    type: "worked",
  },
  {
    label: "Terminal-only development works",
    text: "This entire web frontend — including this 1000+ line page — was built without opening a browser preview. Claude Code writes the code, TypeScript catches the errors. You only need the browser for final visual verification.",
    type: "worked",
  },
  {
    label: "Security debt compounds silently",
    text: "Production secrets in git, unauthenticated delete endpoints, and IDOR vulnerabilities were all live in the codebase. Without a systematic audit, these would have shipped to production. AI-assisted auditing caught them in hours, not weeks.",
    type: "hard",
  },
];

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function TechPage() {
  const maxLocValue = Math.max(...LOC_BY_PROJECT.map((p) => p.loc));

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
            Under the Hood
          </h1>
          <p style={{ margin: "4px 0 0", color: t.muted, fontSize: 13 }}>
            Tastemakers &middot; Technical Overview &middot; Last updated March
            2025
          </p>
        </div>
        <nav style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
          {[
            { href: "/", label: "Home" },
            { href: "/roadmap", label: "Roadmap" },
            { href: "/changelog", label: "Changelog" },
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

      {/* ── Table of Contents ── */}
      <nav
        style={{
          padding: "16px 32px",
          borderBottom: `1px solid ${t.border}`,
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 20px",
          fontSize: 12,
          fontFamily: t.mono,
          color: t.muted,
        }}
      >
        {[
          ["genesis", "Genesis"],
          ["numbers", "By the Numbers"],
          ["cost", "Cost Comparison"],
          ["ai-workflow", "AI Workflow"],
          ["architecture", "Architecture"],
          ["stack", "Tech Stack"],
          ["schema", "Database Schema"],
          ["modules", "Feature Modules"],
          ["journal", "Build Journal"],
          ["lessons", "Lessons Learned"],
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

      <main
        style={{
          padding: "40px 32px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* ── 01 Genesis ── */}
        <Section id="genesis" number="01" title="Genesis">
          <Card>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.8,
                color: t.muted,
                margin: 0,
              }}
            >
              Tastemakers is a social restaurant discovery platform where users
              and &ldquo;tastemakers&rdquo; discover, review, tag, and curate
              restaurant lists. The project started as an iOS app with a Laravel
              API backend — built by a solo developer learning to ship a
              full-stack product. It has since expanded to Android, a Next.js web
              frontend, and a WordPress marketing site.
            </p>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.8,
                color: t.muted,
                margin: "12px 0 0",
              }}
            >
              I&rsquo;m now rebuilding and auditing the full stack with Claude
              Code — working entirely from the terminal, with AI handling the
              heavy lifting of code auditing, boilerplate generation, and
              cross-repo consistency checks. This page is a living record of
              that process: what was built, how it was built, and what it would
              cost to replicate.
            </p>
            <div
              style={{
                marginTop: 16,
                paddingTop: 12,
                borderTop: `1px solid ${t.border}`,
                display: "flex",
                gap: 16,
                fontSize: 13,
              }}
            >
              <a
                href="/roadmap"
                style={{ color: t.accent, textDecoration: "none" }}
              >
                View Roadmap &rarr;
              </a>
            </div>
          </Card>
        </Section>

        {/* ── 02 By the Numbers ── */}
        <Section id="numbers" number="02" title="By the Numbers">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 16,
            }}
          >
            {STATS.map((s) => (
              <Card key={s.label} style={{ padding: "16px 12px" }}>
                <StatBox {...s} />
              </Card>
            ))}
          </div>
          <Card style={{ marginTop: 16 }}>
            <h3
              style={{ margin: "0 0 8px", fontSize: 14, color: t.text }}
            >
              LOC by Project
            </h3>
            <div style={{ fontSize: 13, fontFamily: t.mono }}>
              {LOC_BY_PROJECT.map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ width: 160, color: t.muted }}>{p.name}</span>
                  <div
                    style={{
                      flex: 1,
                      height: 16,
                      background: t.border,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(p.loc / maxLocValue) * 100}%`,
                        height: "100%",
                        background: p.color,
                        borderRadius: 4,
                        minWidth: 2,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 60,
                      textAlign: "right",
                      color: p.color,
                    }}
                  >
                    {p.loc.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── 03 Cost Comparison ── */}
        <Section id="cost" number="03" title="What Would This Cost to Build?">
          <Collapsible
            title="Cost Comparison Calculator"
            subtitle="US dev shop vs offshore vs AI-assisted"
            defaultOpen
          >
            <div
              style={{
                display: "grid",
                gap: 16,
                marginTop: 8,
              }}
            >
              {COST_COMPARISON.map((tier) => {
                const costLow =
                  tier.tier === "AI-Assisted (Actual)"
                    ? 200
                    : tier.hoursLow *
                      parseInt(tier.rateRange.replace(/[^0-9]/g, ""));
                const costHigh =
                  tier.tier === "AI-Assisted (Actual)"
                    ? 4000
                    : tier.hoursHigh *
                      parseInt(
                        tier.rateRange.split("–")[1]?.replace(/[^0-9]/g, "") ||
                          tier.rateRange.replace(/[^0-9]/g, "")
                      );

                return (
                  <div
                    key={tier.tier}
                    style={{
                      background: `${tier.color}08`,
                      borderRadius: 8,
                      border: `1px solid ${tier.color}30`,
                      padding: "16px 20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: tier.color,
                          }}
                        >
                          {tier.tier}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: t.muted,
                            marginLeft: 10,
                          }}
                        >
                          {tier.label}
                        </span>
                      </div>
                      <Badge color={tier.color}>{tier.rateRange}</Badge>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 24,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontFamily: t.mono,
                            fontSize: 13,
                            color: t.dim,
                          }}
                        >
                          Hours:{" "}
                        </span>
                        <span
                          style={{
                            fontFamily: t.mono,
                            fontSize: 14,
                            color: t.text,
                          }}
                        >
                          {tier.hoursLow.toLocaleString()}–
                          {tier.hoursHigh.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            fontFamily: t.mono,
                            fontSize: 13,
                            color: t.dim,
                          }}
                        >
                          Total:{" "}
                        </span>
                        <span
                          style={{
                            fontFamily: t.mono,
                            fontSize: 14,
                            fontWeight: 700,
                            color: tier.color,
                          }}
                        >
                          ${costLow.toLocaleString()}–$
                          {costHigh.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: t.dim,
                      }}
                    >
                      {tier.notes}
                    </p>
                  </div>
                );
              })}
            </div>

            <Collapsible title="Scope Breakdown" subtitle="What's included">
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 13,
                  color: t.muted,
                  lineHeight: 1.8,
                }}
              >
                {COST_SCOPE.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Collapsible>

            <p
              style={{
                margin: "16px 0 0",
                fontSize: 11,
                color: t.dim,
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              Disclaimer: These are rough estimates based on actual codebase
              complexity (69K LOC, 50 API endpoints, 4 client platforms, 15 DB
              tables). Actual costs vary by team experience, project management
              overhead, design requirements, and scope changes. AI-assisted
              costs reflect human hours only — AI API costs are minimal (~$20/mo
              for Claude Code).
            </p>
          </Collapsible>
        </Section>

        {/* ── 04 AI Development Workflow ── */}
        <Section id="ai-workflow" number="04" title="AI Development Workflow">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {AI_WORKFLOW.map((card) => (
              <Card key={card.title}>
                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: 14,
                    color: t.text,
                    fontWeight: 700,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: t.muted,
                    lineHeight: 1.7,
                  }}
                >
                  {card.description}
                </p>
              </Card>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
              marginTop: 20,
              padding: "16px 24px",
              background: t.surface,
              borderRadius: 8,
              border: `1px solid ${t.border}`,
            }}
          >
            <StatBox value="6+" label="Sessions" color={t.accent} />
            <StatBox value="6" label="CLAUDE.md Files" color={t.purple} />
            <StatBox value="50+" label="Tracked Issues" color={t.yellow} />
            <StatBox value="5" label="Repos Managed" color={t.green} />
          </div>
        </Section>

        {/* ── 05 Architecture Overview ── */}
        <Section id="architecture" number="05" title="Architecture Overview">
          <MermaidDiagram id="arch-diagram" chart={ARCHITECTURE_DIAGRAM} />
          <Card style={{ marginTop: 16, fontSize: 13, color: t.muted }}>
            <p style={{ margin: 0 }}>
              All clients (iOS, Android, Web) consume the same Laravel API. The
              web frontend proxies <code>/api/*</code> requests through Next.js
              rewrites to avoid CORS. External services (Foursquare, FCM) are
              called via raw cURL from the backend — no SDK abstractions.
            </p>
          </Card>
        </Section>

        {/* ── 06 Tech Stack ── */}
        <Section id="stack" number="06" title="Tech Stack">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {TECH_STACK.map((group) => (
              <Card key={group.category}>
                <h3
                  style={{
                    margin: "0 0 10px",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: t.dim,
                  }}
                >
                  {group.category}
                </h3>
                {group.items.map((item) => (
                  <div key={item.name} style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {item.name}
                    </span>
                    <span
                      style={{ color: t.muted, fontSize: 13, marginLeft: 8 }}
                    >
                      {item.detail}
                    </span>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </Section>

        {/* ── 07 Database Schema ── */}
        <Section id="schema" number="07" title="Database Schema">
          <p
            style={{
              fontSize: 13,
              color: t.muted,
              marginBottom: 16,
              marginTop: 0,
            }}
          >
            15 tables &middot; PostgreSQL &middot; Laravel Eloquent &middot;
            Click to expand each domain group.
          </p>

          {[
            {
              title: "Core — Users, Restaurants, Tags",
              desc: "Main entities and many-to-many pivots",
              diagram: ERD_CORE,
              id: "erd-core",
            },
            {
              title: "Categories & Predefined Tags",
              desc: "Cuisine categories and tag/restaurant associations",
              diagram: ERD_CATEGORIES,
              id: "erd-categories",
            },
            {
              title: "Access Control — Roles & Modules",
              desc: "RBAC with granular view/add/edit/delete permissions",
              diagram: ERD_ACCESS,
              id: "erd-access",
            },
          ].map((group) => (
            <Collapsible
              key={group.id}
              title={group.title}
              subtitle={group.desc}
            >
              <MermaidDiagram id={group.id} chart={group.diagram} />
            </Collapsible>
          ))}

          <Card
            style={{
              marginTop: 16,
              fontSize: 13,
              color: t.muted,
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: t.text }}>Schema notes:</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              <li>
                All pivot tables use explicit <code>id</code> PKs (not composite
                keys)
              </li>
              <li>Soft deletes on: users, restaurants, tags, countries</li>
              <li>
                <code>restaurant_tag</code> is a 3-way pivot (user + restaurant
                + tag)
              </li>
              <li>
                <code>lat</code>/<code>lng</code> stored as strings, not numeric
                types
              </li>
              <li>
                No FK constraints in migrations — only column definitions
              </li>
              <li>
                <code>users.role_id</code> is <code>integer</code>, all other
                FKs are <code>bigInteger</code>
              </li>
            </ul>
          </Card>
        </Section>

        {/* ── 08 Feature Modules ── */}
        <Section id="modules" number="08" title="Feature Modules">
          <Collapsible
            title={`${FEATURE_MODULES.length} Modules`}
            subtitle="Click to expand"
            defaultOpen
          >
            <div style={{ display: "grid", gap: 8 }}>
              {FEATURE_MODULES.map((mod) => (
                <div
                  key={mod.name}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      minWidth: 160,
                      color: t.text,
                    }}
                  >
                    {mod.name}
                  </span>
                  <span style={{ fontSize: 13, color: t.muted }}>
                    {mod.desc}
                  </span>
                </div>
              ))}
            </div>
          </Collapsible>
        </Section>

        {/* ── 09 Build Journal ── */}
        <Section id="journal" number="09" title="Build Journal">
          <Collapsible
            title={`${BUILD_JOURNAL.length} Sessions`}
            subtitle="Most recent first"
            defaultOpen
          >
            <div style={{ position: "relative" }}>
              {/* Timeline line */}
              <div
                style={{
                  position: "absolute",
                  left: 15,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  background: t.border,
                }}
              />
              {BUILD_JOURNAL.map((entry, i) => {
                const typeColor =
                  entry.type === "feature"
                    ? t.green
                    : entry.type === "fix"
                      ? t.accent
                      : entry.type === "mistake"
                        ? t.red
                        : entry.type === "refactor"
                          ? t.yellow
                          : t.purple;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 20,
                      marginBottom: 4,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: 18,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: typeColor,
                          border: `2px solid ${t.bg}`,
                          zIndex: 1,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, paddingBottom: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: t.mono,
                            fontSize: 12,
                            color: t.dim,
                          }}
                        >
                          {entry.date}
                        </span>
                        <Badge color={typeColor}>{entry.type}</Badge>
                      </div>
                      <h3
                        style={{
                          margin: "0 0 6px",
                          fontSize: 15,
                          color: t.text,
                        }}
                      >
                        {entry.title}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: t.muted,
                          lineHeight: 1.7,
                        }}
                      >
                        {entry.details}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Collapsible>
        </Section>

        {/* ── 10 Lessons Learned ── */}
        <Section id="lessons" number="10" title="Lessons Learned">
          <Collapsible
            title={`${LESSONS.length} Insights`}
            subtitle="What worked and what was hard"
            defaultOpen
          >
            <div style={{ display: "grid", gap: 12 }}>
              {LESSONS.map((lesson) => (
                <div
                  key={lesson.label}
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Badge
                      color={lesson.type === "worked" ? t.green : t.orange}
                    >
                      {lesson.type === "worked" ? "what worked" : "what was hard"}
                    </Badge>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      {lesson.label}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      color: t.muted,
                      lineHeight: 1.7,
                    }}
                  >
                    {lesson.text}
                  </p>
                </div>
              ))}
            </div>
          </Collapsible>
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
          Built with Claude Code &middot; ~6 sessions &middot; Data sourced from
          git history, migrations, and route definitions
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <a
            href="/roadmap"
            style={{ color: t.accent, textDecoration: "none", fontSize: 12 }}
          >
            Roadmap &rarr;
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
