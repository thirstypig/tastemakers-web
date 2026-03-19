"use client";

import { useState, type ReactNode } from "react";

/* ─────────────────────────────────────────────
   Design tokens — shared with /tech page
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

/* ─────────────────────────────────────────────
   SVG Score Ring Component
   ───────────────────────────────────────────── */

function ScoreRing({
  score,
  max = 10,
  size = 180,
  strokeWidth = 14,
}: {
  score: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / max) * circumference;
  const color = score >= 7 ? t.green : score >= 4 ? t.yellow : t.red;

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={t.border}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${circumference - progress}`}
        strokeDashoffset={circumference / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x={size / 2}
        y={size / 2 - 8}
        textAnchor="middle"
        fill={color}
        fontSize={36}
        fontWeight={700}
        fontFamily={t.mono}
      >
        {score}
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        textAnchor="middle"
        fill={t.dim}
        fontSize={13}
        fontFamily={t.mono}
      >
        / {max}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Data — Health Scorecard
   ───────────────────────────────────────────── */

const HEALTH_CATEGORIES: {
  name: string;
  score: number;
  max: number;
  color: string;
}[] = [
  { name: "Architecture", score: 4, max: 10, color: t.yellow },
  { name: "Code Quality", score: 3, max: 10, color: t.red },
  { name: "Security", score: 2, max: 10, color: t.red },
  { name: "Testing", score: 1, max: 10, color: t.red },
  { name: "Documentation", score: 7, max: 10, color: t.green },
  { name: "Tooling", score: 6, max: 10, color: t.yellow },
];

const OVERALL_SCORE =
  Math.round(
    (HEALTH_CATEGORIES.reduce((sum, c) => sum + c.score, 0) /
      HEALTH_CATEGORIES.reduce((sum, c) => sum + c.max, 0)) *
      100
  ) / 10;

/* ─────────────────────────────────────────────
   Data — Product Roadmap
   ───────────────────────────────────────────── */

type RoadmapStatus = "planned" | "in-progress" | "done";

const PRODUCT_ROADMAP: {
  phase: string;
  label: string;
  color: string;
  items: {
    title: string;
    description: string;
    effort: string;
    status: RoadmapStatus;
    tags: string[];
  }[];
}[] = [
  {
    phase: "Short Term",
    label: "Next 1–2 sessions",
    color: t.green,
    items: [
      {
        title: "Rotate exposed production credentials",
        description:
          "Change DB passwords, API keys, and WordPress salts exposed in .env_bkp and wp-config.php. Remove files from git history.",
        effort: "2h",
        status: "planned",
        tags: ["security", "P1"],
      },
      {
        title: "Fix unauthenticated delete endpoints",
        description:
          "Move image-delete, tags-delete, tastemakerlist-delete inside auth:api middleware group in routes/api.php.",
        effort: "1h",
        status: "planned",
        tags: ["security", "P1"],
      },
      {
        title: "Fix IDOR — replace user_id from request with Auth::id()",
        description:
          "Audit all endpoints accepting user_id from request body. Replace with Auth::user()->id in RestaurantController and TagController.",
        effort: "3h",
        status: "planned",
        tags: ["security", "P1"],
      },
      {
        title: "Fix Apple Sign-In JWT verification",
        description:
          "Verify JWT signature against Apple's JWKS endpoint instead of just base64 decoding. Use firebase/php-jwt or lcobucci/jwt.",
        effort: "4h",
        status: "planned",
        tags: ["security", "P1"],
      },
      {
        title: "Resolve API field name mismatches",
        description:
          "Align tag_name vs name, description vs short_description across backend, iOS, Android, and web TypeScript types.",
        effort: "3h",
        status: "planned",
        tags: ["cross-platform", "P1"],
      },
    ],
  },
  {
    phase: "Medium Term",
    label: "3–6 sessions",
    color: t.yellow,
    items: [
      {
        title: "Add database indexes to pivot tables",
        description:
          "Add indexes to restaurant_tag, restaurant_user, category_restaurant FK columns. Index users.is_testmaker and restaurants.place_id.",
        effort: "2h",
        status: "planned",
        tags: ["performance", "P1"],
      },
      {
        title: "Fix N+1 queries in restaurant/tastemaker endpoints",
        description:
          "Use eager loading (with/withCount) in restaurantDetails, getRestaurants, and tastemaker list endpoints. Target: <10 queries per request.",
        effort: "6h",
        status: "planned",
        tags: ["performance", "P1"],
      },
      {
        title: "Extract RestaurantController into service classes",
        description:
          "Break 2,985-line god controller into RestaurantService, ListService, ImageService, FoursquareService. Add Form Request validation.",
        effort: "12h",
        status: "planned",
        tags: ["architecture", "P2"],
      },
      {
        title: "Implement rate limiting on auth endpoints",
        description:
          "Add throttle middleware to login, signup, password reset. Replace rand() OTP with random_int(). Add OTP expiration.",
        effort: "3h",
        status: "planned",
        tags: ["security", "P2"],
      },
      {
        title: "Upgrade web auth to httpOnly cookies",
        description:
          "Replace localStorage token with httpOnly cookie via API middleware. Eliminate XSS token theft vector.",
        effort: "4h",
        status: "planned",
        tags: ["security", "P2"],
      },
      {
        title: "Fix Android compilation",
        description:
          "Add Hilt AppModule, create google-services.json placeholder, remove premature Phase 3–5 dependencies.",
        effort: "3h",
        status: "planned",
        tags: ["android", "P2"],
      },
      {
        title: "Add TypeScript response envelopes",
        description:
          "Create AuthResponse, RestaurantsResponse, TagsResponse wrapper types matching backend { status, data, message } format.",
        effort: "2h",
        status: "planned",
        tags: ["web", "P2"],
      },
      {
        title: "Standardize API response format",
        description:
          "Create ApiResponse trait for consistent { status, data, message } envelope across all controller methods.",
        effort: "6h",
        status: "planned",
        tags: ["architecture", "P3"],
      },
    ],
  },
  {
    phase: "Long Term",
    label: "7+ sessions",
    color: t.purple,
    items: [
      {
        title: "Web app Phase 2 — Authentication flows",
        description:
          "Build login, register, forgot password pages. Google OAuth client-side flow. Auth context provider. Route protection middleware.",
        effort: "16h",
        status: "planned",
        tags: ["web", "feature"],
      },
      {
        title: "Web app Phase 3 — Core pages",
        description:
          "Home/discover, restaurant detail, search, cuisine browse, tastemaker profile pages with server-side rendering for SEO.",
        effort: "24h",
        status: "planned",
        tags: ["web", "feature"],
      },
      {
        title: "Migrate lat/lng to DECIMAL + spatial indexing",
        description:
          "Change lat/lng from VARCHAR to DECIMAL(10,7). Extract Haversine into model scope. Add spatial index for geo queries.",
        effort: "4h",
        status: "planned",
        tags: ["performance", "database"],
      },
      {
        title: "Comprehensive backend test suite",
        description:
          "Write PHPUnit tests for all 50 API endpoints. Priority: auth, restaurant CRUD, list operations. Target: 80% coverage.",
        effort: "20h",
        status: "planned",
        tags: ["testing", "quality"],
      },
      {
        title: "Admin panel rebuild in Next.js",
        description:
          "Replace Blade admin panel with React admin in tastemakers-web. RBAC, user/restaurant/tag management, analytics dashboard.",
        effort: "30h",
        status: "planned",
        tags: ["web", "admin", "feature"],
      },
      {
        title: "CI/CD pipeline",
        description:
          "GitHub Actions for lint, type-check, PHPUnit, build. Auto-deploy on merge to main. Secret scanning in pre-commit hook.",
        effort: "8h",
        status: "planned",
        tags: ["infrastructure", "tooling"],
      },
    ],
  },
];

/* ─────────────────────────────────────────────
   Data — Session Velocity
   ───────────────────────────────────────────── */

const SESSION_VELOCITY: {
  session: string;
  completed: number;
  type: string;
  color: string;
}[] = [
  { session: "Session 1", completed: 31, type: "Backend audit findings", color: t.purple },
  { session: "Session 2", completed: 3, type: "Web scaffold + config", color: t.green },
  { session: "Session 3", completed: 19, type: "Cross-project findings", color: t.yellow },
  { session: "Session 4", completed: 10, type: "Security audit items", color: t.red },
  { session: "Session 5", completed: 2, type: "Android assessment", color: t.orange },
  { session: "Session 6", completed: 4, type: "Tech + roadmap pages", color: t.accent },
];

const MAX_VELOCITY = Math.max(...SESSION_VELOCITY.map((s) => s.completed));

/* ─────────────────────────────────────────────
   Data — Next Session Planner
   ───────────────────────────────────────────── */

const NEXT_SESSION: {
  priority: number;
  task: string;
  reason: string;
  effort: string;
}[] = [
  {
    priority: 1,
    task: "Rotate production credentials (.env_bkp, wp-config.php)",
    reason: "Active secret exposure — every day they remain is a breach risk",
    effort: "2h",
  },
  {
    priority: 2,
    task: "Move delete endpoints inside auth:api middleware",
    reason: "Anonymous users can delete images, tags, and lists right now",
    effort: "1h",
  },
  {
    priority: 3,
    task: "Fix IDOR — replace user_id from request body with Auth::id()",
    reason: "Authenticated users can act as any other user",
    effort: "3h",
  },
  {
    priority: 4,
    task: "Fix Apple Sign-In JWT signature verification",
    reason: "Attacker can forge JWT and log in as any email address",
    effort: "4h",
  },
  {
    priority: 5,
    task: "Remove debug echo/print_r leaking Foursquare API credentials",
    reason: "API credentials visible in HTTP responses on public endpoints",
    effort: "30m",
  },
];

/* ─────────────────────────────────────────────
   Data — Risk Register
   ───────────────────────────────────────────── */

type RiskStatus = "active" | "mitigated" | "monitoring";

const RISK_REGISTER: {
  risk: string;
  impact: "critical" | "high" | "medium" | "low";
  likelihood: "certain" | "likely" | "possible" | "unlikely";
  mitigation: string;
  status: RiskStatus;
}[] = [
  {
    risk: "Production secrets exposed in git history",
    impact: "critical",
    likelihood: "certain",
    mitigation: "Rotate all credentials, use git-filter-repo to scrub history, enforce .gitignore",
    status: "active",
  },
  {
    risk: "IDOR allows cross-user data manipulation",
    impact: "critical",
    likelihood: "likely",
    mitigation: "Replace all user_id from request body with Auth::id()",
    status: "active",
  },
  {
    risk: "Apple Sign-In JWT forgery",
    impact: "critical",
    likelihood: "possible",
    mitigation: "Implement proper JWKS signature verification",
    status: "active",
  },
  {
    risk: "N+1 queries cause timeouts at scale",
    impact: "high",
    likelihood: "likely",
    mitigation: "Add eager loading, indexes, and query monitoring",
    status: "active",
  },
  {
    risk: "No test coverage — refactoring breaks things silently",
    impact: "high",
    likelihood: "certain",
    mitigation: "Write critical-path tests before major refactors",
    status: "active",
  },
  {
    risk: "God controllers make changes risky",
    impact: "medium",
    likelihood: "likely",
    mitigation: "Extract into service classes incrementally",
    status: "monitoring",
  },
  {
    risk: "XSS via localStorage token theft",
    impact: "high",
    likelihood: "possible",
    mitigation: "Migrate to httpOnly cookies",
    status: "active",
  },
  {
    risk: "Android app cannot compile",
    impact: "medium",
    likelihood: "certain",
    mitigation: "Fix Hilt module + remove premature dependencies",
    status: "monitoring",
  },
];

/* ─────────────────────────────────────────────
   Data — Audit Recommendations
   ───────────────────────────────────────────── */

const AUDIT_RECS: {
  priority: "P1" | "P2" | "P3";
  recommendation: string;
  category: string;
  effort: string;
}[] = [
  { priority: "P1", recommendation: "Credential rotation + secret scrubbing from git", category: "Security", effort: "2h" },
  { priority: "P1", recommendation: "Move destructive endpoints behind auth middleware", category: "Security", effort: "1h" },
  { priority: "P1", recommendation: "Fix all IDOR vulnerabilities (5 endpoints)", category: "Security", effort: "3h" },
  { priority: "P1", recommendation: "Verify Apple Sign-In JWT signatures against JWKS", category: "Security", effort: "4h" },
  { priority: "P1", recommendation: "Add database indexes to all pivot table FKs", category: "Performance", effort: "2h" },
  { priority: "P1", recommendation: "Fix N+1 query catastrophe in tastemaker endpoints", category: "Performance", effort: "6h" },
  { priority: "P2", recommendation: "Extract Foursquare API calls into service class", category: "Architecture", effort: "4h" },
  { priority: "P2", recommendation: "Add rate limiting to authentication endpoints", category: "Security", effort: "3h" },
  { priority: "P2", recommendation: "Replace localStorage auth with httpOnly cookies", category: "Security", effort: "4h" },
  { priority: "P2", recommendation: "Add Form Request validation classes", category: "Architecture", effort: "6h" },
  { priority: "P2", recommendation: "Fix Android compilation (Hilt + google-services)", category: "Platform", effort: "3h" },
  { priority: "P3", recommendation: "Extract Haversine into reusable model scope", category: "Quality", effort: "2h" },
  { priority: "P3", recommendation: "Remove 390+ lines of commented-out code", category: "Quality", effort: "1h" },
  { priority: "P3", recommendation: "Rename testmaker → tastemaker (228 occurrences)", category: "Quality", effort: "4h" },
  { priority: "P3", recommendation: "Write PHPUnit tests for critical auth/CRUD paths", category: "Testing", effort: "12h" },
];

/* ─────────────────────────────────────────────
   Data — Findings (P1/P2/P3) — All 50 items
   ───────────────────────────────────────────── */

type FindingStatus = "open" | "completed";

interface Finding {
  id: string;
  title: string;
  description: string;
  filePath: string;
  effort: string;
  tags: string[];
  foundDate: string;
  fixedDate: string | null;
  source: "cross-project" | "backend";
  status: FindingStatus;
}

const P1_FINDINGS: Finding[] = [
  // Cross-project P1s
  {
    id: "X-001",
    title: ".env_bkp with Production Secrets in Git",
    description:
      "DB password, mail password, Foursquare client ID/secret, Laravel APP_KEY all exposed in committed file.",
    filePath: "tastemakers-backend/.env_bkp",
    effort: "2h",
    tags: ["security", "secrets"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-002",
    title: "Tag name vs tag_name Field Mismatch",
    description:
      "Backend uses 'name' column, TypeScript and Kotlin expect 'tag_name'. Tag names deserialize as null/undefined.",
    filePath: "app/Models/Tag.php:16, src/types/index.ts:25",
    effort: "3h",
    tags: ["cross-platform", "data"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-003",
    title: "User short_description vs description Mismatch",
    description:
      "Backend stores short_description, all clients expect description. Profile bios fail to save/load.",
    filePath: "app/Models/User.php, src/types/index.ts",
    effort: "2h",
    tags: ["cross-platform", "data"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-004",
    title: "search-tags Endpoint Divergence",
    description:
      "iOS calls pre-define-search-tags (CategoryController), docs say search-tags (TagController). New clients will call wrong endpoint.",
    filePath: "iOS: NetworkManager.swift:35, routes/api.php",
    effort: "2h",
    tags: ["cross-platform", "routing"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-005",
    title: "wp-config.php Production DB Password Exposed",
    description:
      "MySQL password, username, all 8 WordPress auth salts exposed on disk.",
    filePath: "tastemakers-wordpress/wp-config.php",
    effort: "1h",
    tags: ["security", "secrets"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  // Backend P1s
  {
    id: "B-001",
    title: "Unauthenticated Destructive Endpoints",
    description:
      "image-delete, tags-delete, tastemakerlist-delete outside auth:api middleware. Anonymous users can delete data.",
    filePath: "routes/api.php:65-67",
    effort: "1h",
    tags: ["security", "routing"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-002",
    title: "Hardcoded Firebase FCM Server Key",
    description:
      "FCM server key, hardcoded device token, Google OAuth client ID in plaintext source code.",
    filePath: "UserController.php:559",
    effort: "2h",
    tags: ["security", "secrets"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-003",
    title: "Broken Apple Sign-In — JWT Never Verified",
    description:
      "jwtTokenDcode() only base64-decodes. Signature never verified against Apple JWKS. Attacker can forge any email.",
    filePath: "UserController.php:1317-1339",
    effort: "4h",
    tags: ["security", "auth"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-004",
    title: "Debug Output Leaks Foursquare API Credentials",
    description:
      "Active echo/print_r statements output full API URL with credentials in HTTP responses.",
    filePath: "RestaurantController.php:332",
    effort: "30m",
    tags: ["security", "secrets"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-005",
    title: "Public /clear-cache Runs Artisan Commands",
    description:
      "Unauthenticated GET /clear-cache runs cache:clear, config:clear, config:cache, route:clear, view:clear.",
    filePath: "web.php:186-194",
    effort: "30m",
    tags: ["security", "routes"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-006",
    title: "IDOR — user_id Accepted from Request Body",
    description:
      "Multiple endpoints accept user_id from request instead of Auth::user()->id. Any user can act as another.",
    filePath: "RestaurantController.php:1489,1713,1828",
    effort: "3h",
    tags: ["security", "auth"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-007",
    title: "Missing Database Indexes on All Pivot Tables",
    description:
      "Zero indexes on FK columns in 3 most-queried pivot tables. Every JOIN triggers full table scan.",
    filePath: "migrations/2021_02_24_*",
    effort: "2h",
    tags: ["performance", "database"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-008",
    title: "N+1 Query Catastrophe",
    description:
      "Loads ALL tastemakers then runs 2+ queries per tastemaker per restaurant. 100 tastemakers = 600+ queries.",
    filePath: "RestaurantController.php:1074-1077",
    effort: "6h",
    tags: ["performance", "queries"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-009",
    title: "OAuth Stores Raw Token as Unhashed Password",
    description:
      "Google/Apple login stores raw OAuth token in password field without Hash::make().",
    filePath: "UserController.php:1288,1362",
    effort: "1h",
    tags: ["security", "auth"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-010",
    title: "env() Called in Controllers — Breaks After config:cache",
    description:
      "env() called 12+ times for Foursquare credentials. Returns null after php artisan config:cache.",
    filePath: "RestaurantController.php:330,512,712",
    effort: "2h",
    tags: ["config", "reliability"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
];

const P2_FINDINGS: Finding[] = [
  // Cross-project P2s
  {
    id: "X-006",
    title: "Web TypeScript Types Missing Response Envelopes",
    description:
      "Types define inner data but not envelopes. Backend wraps in { status, ... }. apiFetch<T>() calls will fail.",
    filePath: "tastemakers-web/src/types/index.ts",
    effort: "2h",
    tags: ["web", "types"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-007",
    title: "Android Won't Compile",
    description:
      "Empty Hilt DI directory, google-services plugin fails without config file. Project cannot build.",
    filePath: "tastemakers-android/app/build.gradle.kts",
    effort: "3h",
    tags: ["android", "build"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-008",
    title: "Web localStorage Token is XSS-Exploitable",
    description:
      "Auth token in localStorage accessible to all JavaScript. Single XSS = full account takeover.",
    filePath: "tastemakers-web/src/lib/api.ts:8",
    effort: "4h",
    tags: ["security", "web"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-009",
    title: "Android user_id in Requests Codifies IDOR",
    description:
      "SaveRestaurantRequest includes user_id field sent to backend, masking IDOR vulnerability.",
    filePath: "tastemakers-android/Models.kt:15",
    effort: "1h",
    tags: ["android", "security"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-010",
    title: "error_log Files with Production Paths in Git",
    description:
      "PHP stack traces revealing /home/tastofgc/public_html/ internal paths.",
    filePath: "tastemakers-backend/app/Http/Controllers/error_log",
    effort: "30m",
    tags: ["security", "cleanup"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-011",
    title: "5 Different Brand Name Spellings",
    description:
      'tastemaker, testmaker (228x), testsmaker, testemakers, TasteMaker across codebase.',
    filePath: "Database + all repos",
    effort: "4h",
    tags: ["quality", "naming"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-012",
    title: "Android Has Premature Phase 3–5 Dependencies",
    description:
      "Google Play Services, Firebase, camera permissions at scaffold stage. Blocks compilation.",
    filePath: "tastemakers-android/app/build.gradle.kts:75-84",
    effort: "2h",
    tags: ["android", "build"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  // Backend P2s
  {
    id: "B-011",
    title: "No Rate Limiting on Auth Endpoints",
    description:
      "Only default 60 req/min throttle. OTP uses rand() not random_int(). OTP never expires.",
    filePath: "api.php:21-24",
    effort: "3h",
    tags: ["security", "auth"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-012",
    title: "God Controller Decomposition Needed",
    description:
      "RestaurantController (2,985 LOC) and UserController (1,623 LOC) handle 9+ domains each.",
    filePath: "RestaurantController.php, UserController.php",
    effort: "12h",
    tags: ["architecture", "refactoring"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-013",
    title: "Extract Foursquare API into Service Class",
    description:
      "Raw cURL duplicated 7 times. CURLOPT_TIMEOUT=0 (infinite). limit=500. No caching.",
    filePath: "RestaurantController.php:333,513,713",
    effort: "4h",
    tags: ["architecture", "performance"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-014",
    title: "SSL Verification Disabled for FCM",
    description:
      "CURLOPT_SSL_VERIFYPEER=false. Vulnerable to MITM intercepting FCM server API key.",
    filePath: "UserController.php:580",
    effort: "30m",
    tags: ["security", "network"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-015",
    title: "lat/lng Stored as Strings",
    description:
      "VARCHAR columns force string-to-numeric cast in Haversine formula (duplicated 16 times). No spatial index.",
    filePath: "create_restaurants_table.php:24-25",
    effort: "4h",
    tags: ["performance", "database"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-016",
    title: "Mass Assignment Risk — Sensitive Fields in $fillable",
    description:
      "role_id, password, forget_code, login_count in $fillable. Any unvalidated create/update = privilege escalation.",
    filePath: "User.php ($fillable)",
    effort: "1h",
    tags: ["security", "models"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-017",
    title: "GET-Based Delete Routes Bypass CSRF",
    description:
      "8 admin delete operations use Route::get(). Not protected by CSRF middleware.",
    filePath: "web.php:48,50,52,77,80,85,87,91",
    effort: "2h",
    tags: ["security", "routes"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-018",
    title: "$_POST Superglobal Used Directly",
    description:
      "HomeController and RestaurantController use $_POST/$_FILES directly, bypassing middleware.",
    filePath: "HomeController.php:393-394",
    effort: "2h",
    tags: ["security", "input"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-019",
    title: "No Form Request Validation Classes",
    description:
      'All validation inline with empty rules like "password" => "". No app/Http/Requests/ directory.',
    filePath: "UserController.php:415-428",
    effort: "6h",
    tags: ["architecture", "validation"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-020",
    title: "Password Reset OTP Never Expires",
    description:
      "forget_code has no expiration timestamp. OTP remains valid indefinitely.",
    filePath: "users table (forget_code column)",
    effort: "2h",
    tags: ["security", "auth"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
];

const P3_FINDINGS: Finding[] = [
  // Cross-project P3s
  {
    id: "X-013",
    title: "TypeScript Nullability Doesn't Match API",
    description:
      "Marks first_name, last_name, address, lat, lng as non-nullable but backend allows nulls.",
    filePath: "tastemakers-web/src/types/index.ts",
    effort: "1h",
    tags: ["web", "types"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-014",
    title: "Android Restaurant Missing city/country Fields",
    description:
      "Missing backend fields. Location info cannot display in Android UI.",
    filePath: "tastemakers-android/Models.kt:44-51",
    effort: "30m",
    tags: ["android", "models"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-015",
    title: "User Models Missing 6 Social Fields",
    description:
      "Backend supports tiktok, youtube, instagram, twitter, facebook, website. Clients can't display/edit.",
    filePath: "src/types/index.ts, Models.kt",
    effort: "1h",
    tags: ["cross-platform", "models"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-016",
    title: "Root CLAUDE.md API Contract Incomplete",
    description:
      "Missing 11+ endpoints. gettastemaker-List marked auth-required but is public.",
    filePath: "CLAUDE.md",
    effort: "1h",
    tags: ["documentation"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-017",
    title: "Android Using kapt Instead of KSP",
    description:
      "Hilt uses slower kapt. Hilt 2.51.1 supports KSP for faster builds.",
    filePath: "tastemakers-android/app/build.gradle.kts:8",
    effort: "1h",
    tags: ["android", "build"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-018",
    title: "WordPress Missing .gitignore and .htaccess",
    description:
      "No .gitignore so wp-config.php could be committed. No .htaccess for sensitive file protection.",
    filePath: "tastemakers-wordpress/",
    effort: "30m",
    tags: ["wordpress", "security"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  {
    id: "X-019",
    title: 'Android allowBackup="true"',
    description:
      "Allows ADB data extraction including auth tokens. Should be false.",
    filePath: "AndroidManifest.xml:11",
    effort: "5m",
    tags: ["android", "security"],
    foundDate: "2026-03-13",
    fixedDate: null,
    source: "cross-project",
    status: "open",
  },
  // Backend P3s
  {
    id: "B-021",
    title: "Haversine Formula Duplicated 16 Times",
    description:
      "Same raw SQL copy-pasted 16 times. Should be a model scope.",
    filePath: "RestaurantController.php",
    effort: "2h",
    tags: ["quality", "duplication"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-022",
    title: "390+ Lines of Commented-Out Code",
    description:
      "13% of RestaurantController is dead code including duplicate getRestaurants1() method.",
    filePath: "RestaurantController.php",
    effort: "1h",
    tags: ["quality", "cleanup"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-023",
    title: '"testmaker" vs "tastemaker" Naming (228 occurrences)',
    description:
      "testmaker_list, testmaker_follow tables, is_testmaker column. Product name is Tastemakers.",
    filePath: "Database + codebase",
    effort: "4h",
    tags: ["quality", "naming"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-024",
    title: "Remove CurModel Alias Anti-Pattern",
    description:
      'Every controller aliases model as CurModel, obscuring actual type.',
    filePath: "All controllers",
    effort: "1h",
    tags: ["quality", "clarity"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-025",
    title: "Replace var Keyword with Proper Visibility",
    description:
      "PHP 4-era var $prop instead of protected/private with type hints. 24 occurrences.",
    filePath: "8 controllers",
    effort: "30m",
    tags: ["quality", "modernization"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-026",
    title: "Inconsistent API Response Format",
    description:
      'Three different structures. Typos: "Unable to fecth restaturants" (10x).',
    filePath: "All controllers",
    effort: "6h",
    tags: ["architecture", "consistency"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-027",
    title: "No Test Coverage",
    description:
      "Only default Laravel example tests. 4,600+ LOC with zero custom tests.",
    filePath: "tests/",
    effort: "12h",
    tags: ["testing"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-028",
    title: "Route Naming Inconsistency",
    description:
      'Mixed casing (ListTitleSave, TastemakerList-edit), typos (resaturantsbylistid).',
    filePath: "routes/api.php",
    effort: "3h",
    tags: ["quality", "consistency"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-029",
    title: "apiTags() Returns ALL Tags Without Pagination",
    description:
      "CurModel::all() on every request. No pagination, caching, or field selection.",
    filePath: "TagController::apiTags()",
    effort: "1h",
    tags: ["performance", "scalability"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-030",
    title: "Permission Checking Copy-Pasted 51 Times",
    description:
      "Auth::user()->checkPermission() repeated 51 times. Should be middleware.",
    filePath: "7 controllers",
    effort: "3h",
    tags: ["architecture", "duplication"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
  {
    id: "B-031",
    title: "DataTable N+1 Queries in Admin Panel",
    description:
      "CurModel::find($row->id)->restaurants->count() per row. Should use withCount.",
    filePath: "TagController::index(), UserController::index()",
    effort: "1h",
    tags: ["performance", "queries"],
    foundDate: "2026-03-12",
    fixedDate: null,
    source: "backend",
    status: "open",
  },
];

/* ─────────────────────────────────────────────
   Data — Findings Pattern Analysis
   ───────────────────────────────────────────── */

const FINDING_PATTERNS: {
  category: string;
  count: number;
  color: string;
}[] = [
  { category: "Security", count: 16, color: t.red },
  { category: "Performance", count: 8, color: t.orange },
  { category: "Architecture", count: 8, color: t.yellow },
  { category: "Quality / Cleanup", count: 11, color: t.purple },
  { category: "Cross-Platform", count: 7, color: t.accent },
];

const PATTERN_INSIGHTS: string[] = [
  "Security issues dominate P1 (10 of 15) — the codebase shipped to production with multiple critical auth vulnerabilities.",
  "Performance issues cluster around two god controllers (RestaurantController, UserController) that contain 70% of all business logic.",
  "Cross-platform field mismatches (tag_name vs name, description vs short_description) indicate the API contract was never formally defined.",
  "All 50 items are currently open — no fixes have been shipped yet, only documentation and tracking.",
  "The testmaker/tastemaker naming inconsistency (228 occurrences) suggests the database was designed by someone other than the product team.",
];

/* ─────────────────────────────────────────────
   Data — Tooling & Workflow
   ───────────────────────────────────────────── */

const TOOLING: {
  category: string;
  items: { name: string; status: "available" | "planned" | "missing"; detail: string }[];
}[] = [
  {
    category: "Available Now",
    items: [
      { name: "Claude Code CLI", status: "available", detail: "AI-assisted development, code auditing, boilerplate generation" },
      { name: "CLAUDE.md context files", status: "available", detail: "6 files providing cross-session project memory" },
      { name: "TypeScript strict mode", status: "available", detail: "Compile-time type safety for web frontend" },
      { name: "ESLint", status: "available", detail: "Code linting for TypeScript/React" },
      { name: "PHPUnit", status: "available", detail: "Backend test framework (no custom tests written yet)" },
    ],
  },
  {
    category: "Planned",
    items: [
      { name: "Tailwind CSS v4", status: "planned", detail: "Replacing inline styles with utility classes" },
      { name: "CI/CD (GitHub Actions)", status: "planned", detail: "Automated lint, type-check, test, build on PR" },
      { name: "Pre-commit hooks", status: "planned", detail: "Secret scanning, lint, type-check before commits" },
      { name: "Error monitoring", status: "planned", detail: "Sentry or similar for production error tracking" },
    ],
  },
  {
    category: "Missing / Needed",
    items: [
      { name: "API documentation", status: "missing", detail: "No Swagger/OpenAPI spec. Docs are in CLAUDE.md only." },
      { name: "Database migrations (down)", status: "missing", detail: "No down() methods — rollbacks impossible" },
      { name: "Staging environment", status: "missing", detail: "No non-production environment for testing" },
      { name: "Logging / APM", status: "missing", detail: "No structured logging or application performance monitoring" },
    ],
  },
];

/* ─────────────────────────────────────────────
   Helper: Finding Card renderer
   ───────────────────────────────────────────── */

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 12,
            color: t.dim,
            minWidth: 50,
          }}
        >
          {finding.id}
        </span>
        <span style={{ fontWeight: 700, fontSize: 14, color: t.text, flex: 1 }}>
          {finding.title}
        </span>
        <Badge color={t.accent}>{finding.effort}</Badge>
        <Badge
          color={
            finding.source === "cross-project" ? t.purple : t.muted
          }
        >
          {finding.source}
        </Badge>
      </div>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 13,
          color: t.muted,
          lineHeight: 1.6,
          paddingLeft: 58,
        }}
      >
        {finding.description}
      </p>
      <div style={{ paddingLeft: 58, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.dim }}>
          {finding.filePath}
        </span>
        <span style={{ color: t.dim, fontSize: 11 }}>·</span>
        <span style={{ fontFamily: t.mono, fontSize: 11, color: t.dim }}>
          Found {finding.foundDate}
        </span>
        {finding.fixedDate && (
          <>
            <span style={{ color: t.dim, fontSize: 11 }}>·</span>
            <span style={{ fontFamily: t.mono, fontSize: 11, color: t.green }}>
              Fixed {finding.fixedDate}
            </span>
          </>
        )}
      </div>
      <div style={{ paddingLeft: 58, marginTop: 4, display: "flex", gap: 4, flexWrap: "wrap" }}>
        {finding.tags.map((tag) => (
          <Badge key={tag} color={t.dim}>
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
   ───────────────────────────────────────────── */

export default function RoadmapPage() {
  const [activePhase, setActivePhase] = useState<string>("Short Term");

  const allFindings = [...P1_FINDINGS, ...P2_FINDINGS, ...P3_FINDINGS];
  const openCount = allFindings.filter((f) => f.status === "open").length;
  const completedCount = allFindings.filter(
    (f) => f.status === "completed"
  ).length;
  const totalCount = allFindings.length;

  const p1Open = P1_FINDINGS.filter((f) => f.status === "open");
  const p1Done = P1_FINDINGS.filter((f) => f.status === "completed");
  const p2Open = P2_FINDINGS.filter((f) => f.status === "open");
  const p2Done = P2_FINDINGS.filter((f) => f.status === "completed");
  const p3Open = P3_FINDINGS.filter((f) => f.status === "open");
  const p3Done = P3_FINDINGS.filter((f) => f.status === "completed");

  const maxPattern = Math.max(...FINDING_PATTERNS.map((p) => p.count));

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
            Roadmap
          </h1>
          <p style={{ margin: "4px 0 0", color: t.muted, fontSize: 13 }}>
            Tastemakers &middot; Project Status &amp; Planning &middot; {openCount} open / {totalCount} total
          </p>
        </div>
        <nav style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
          {[
            { href: "/", label: "Home" },
            { href: "/tech", label: "Under the Hood" },
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
        }}
      >
        {[
          ["health", "Health"],
          ["roadmap", "Roadmap"],
          ["velocity", "Velocity"],
          ["next-session", "Next Session"],
          ["risks", "Risks"],
          ["audit", "Audit Recs"],
          ["patterns", "Patterns"],
          ["tooling", "Tooling"],
          ["progress", "Progress"],
          ["p1", "P1"],
          ["p2", "P2"],
          ["p3", "P3"],
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
        {/* ── 01 Health Scorecard ── */}
        <Section id="health" number="01" title="Project Health Scorecard">
          <Card>
            <div
              style={{
                display: "flex",
                gap: 40,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <ScoreRing score={OVERALL_SCORE} />
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: t.dim,
                    fontFamily: t.mono,
                  }}
                >
                  Overall Score
                </p>
              </div>
              <div style={{ flex: 1, minWidth: 280 }}>
                {HEALTH_CATEGORIES.map((cat) => (
                  <div
                    key={cat.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 120,
                        fontSize: 13,
                        color: t.muted,
                      }}
                    >
                      {cat.name}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 20,
                        background: t.border,
                        borderRadius: 4,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${(cat.score / cat.max) * 100}%`,
                          height: "100%",
                          background: cat.color,
                          borderRadius: 4,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: t.mono,
                        fontSize: 13,
                        color: cat.color,
                        width: 40,
                        textAlign: "right",
                      }}
                    >
                      {cat.score}/{cat.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Section>

        {/* ── 02 Product Roadmap ── */}
        <Section id="roadmap" number="02" title="Product Roadmap">
          {PRODUCT_ROADMAP.map((phase) => (
            <details
              key={phase.phase}
              open={phase.phase === activePhase || undefined}
              style={{
                marginBottom: 12,
                background: t.surface,
                borderRadius: 8,
                border: `1px solid ${phase.color}40`,
                borderLeft: `4px solid ${phase.color}`,
                overflow: "hidden",
              }}
              onToggle={(e) => {
                if ((e.target as HTMLDetailsElement).open) {
                  setActivePhase(phase.phase);
                }
              }}
            >
              <summary
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: 700,
                  color: t.text,
                  listStyle: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <span style={{ color: phase.color }}>{phase.phase}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: t.dim,
                      fontWeight: 400,
                      marginLeft: 12,
                    }}
                  >
                    {phase.label}
                  </span>
                </span>
                <Badge color={phase.color}>
                  {phase.items.length} items
                </Badge>
              </summary>
              <div style={{ padding: "0 20px 20px" }}>
                {phase.items.map((item, i) => {
                  const statusColor =
                    item.status === "done"
                      ? t.green
                      : item.status === "in-progress"
                        ? t.yellow
                        : t.dim;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "12px 0",
                        borderBottom:
                          i < phase.items.length - 1
                            ? `1px solid ${t.border}`
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: t.text,
                            flex: 1,
                          }}
                        >
                          {item.title}
                        </span>
                        <Badge color={statusColor}>{item.status}</Badge>
                        <Badge color={t.accent}>{item.effort}</Badge>
                      </div>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontSize: 13,
                          color: t.muted,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        {item.tags.map((tag) => (
                          <Badge key={tag} color={t.dim}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </Section>

        {/* ── 03 Session Velocity ── */}
        <Section id="velocity" number="03" title="Session Velocity">
          <Card>
            {SESSION_VELOCITY.map((s) => (
              <div
                key={s.session}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 80,
                    fontSize: 12,
                    fontFamily: t.mono,
                    color: t.dim,
                    flexShrink: 0,
                  }}
                >
                  {s.session}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 24,
                    background: t.border,
                    borderRadius: 4,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${(s.completed / MAX_VELOCITY) * 100}%`,
                      height: "100%",
                      background: s.color,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 8,
                      minWidth: 40,
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
                      {s.completed}
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: t.muted,
                    width: 180,
                    flexShrink: 0,
                  }}
                >
                  {s.type}
                </span>
              </div>
            ))}
          </Card>
        </Section>

        {/* ── 04 Next Session Planner ── */}
        <Section id="next-session" number="04" title="Next Session Planner">
          <Card>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: 13,
                color: t.muted,
              }}
            >
              Priority-ordered tasks for the next development session.
              All are P1 critical security fixes.
            </p>
            {NEXT_SESSION.map((task) => (
              <div
                key={task.priority}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: `1px solid ${t.border}`,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: `${t.accent}20`,
                    color: t.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: t.mono,
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {task.priority}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: t.text,
                      }}
                    >
                      {task.task}
                    </span>
                    <Badge color={t.accent}>{task.effort}</Badge>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: t.dim,
                    }}
                  >
                    {task.reason}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </Section>

        {/* ── 05 Risk Register ── */}
        <Section id="risks" number="05" title="Risk Register">
          <Collapsible
            title={`${RISK_REGISTER.length} Tracked Risks`}
            subtitle={`${RISK_REGISTER.filter((r) => r.status === "active").length} active`}
            defaultOpen
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: `2px solid ${t.border}`,
                    }}
                  >
                    {["Risk", "Impact", "Likelihood", "Mitigation", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            color: t.dim,
                            fontSize: 11,
                            fontFamily: t.mono,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {RISK_REGISTER.map((risk, i) => {
                    const impactColor =
                      risk.impact === "critical"
                        ? t.red
                        : risk.impact === "high"
                          ? t.orange
                          : risk.impact === "medium"
                            ? t.yellow
                            : t.muted;
                    const statusColor =
                      risk.status === "active"
                        ? t.red
                        : risk.status === "mitigated"
                          ? t.green
                          : t.yellow;
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: `1px solid ${t.border}`,
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            color: t.text,
                            maxWidth: 240,
                          }}
                        >
                          {risk.risk}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge color={impactColor}>{risk.impact}</Badge>
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: t.muted,
                          }}
                        >
                          {risk.likelihood}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: t.muted,
                            fontSize: 12,
                            maxWidth: 280,
                          }}
                        >
                          {risk.mitigation}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Badge color={statusColor}>{risk.status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Collapsible>
        </Section>

        {/* ── 06 Audit Recommendations ── */}
        <Section id="audit" number="06" title="Audit Recommendations">
          <Collapsible
            title={`${AUDIT_RECS.length} Recommendations`}
            subtitle="Prioritized action items from code reviews"
            defaultOpen
          >
            {AUDIT_RECS.map((rec, i) => {
              const prioColor =
                rec.priority === "P1"
                  ? t.red
                  : rec.priority === "P2"
                    ? t.yellow
                    : t.muted;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: `1px solid ${t.border}`,
                    flexWrap: "wrap",
                  }}
                >
                  <Badge color={prioColor}>{rec.priority}</Badge>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: t.text,
                      minWidth: 200,
                    }}
                  >
                    {rec.recommendation}
                  </span>
                  <Badge color={t.dim}>{rec.category}</Badge>
                  <Badge color={t.accent}>{rec.effort}</Badge>
                </div>
              );
            })}
          </Collapsible>
        </Section>

        {/* ── 07 Findings History & Patterns ── */}
        <Section id="patterns" number="07" title="Findings History & Patterns">
          <Collapsible
            title="Pattern Analysis"
            subtitle={`${totalCount} total findings across ${FINDING_PATTERNS.length} categories`}
            defaultOpen
          >
            <div style={{ marginBottom: 20 }}>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: t.dim,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Category Breakdown
              </h4>
              {FINDING_PATTERNS.map((pat) => (
                <div
                  key={pat.category}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      width: 140,
                      fontSize: 13,
                      color: t.muted,
                    }}
                  >
                    {pat.category}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 20,
                      background: t.border,
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(pat.count / maxPattern) * 100}%`,
                        height: "100%",
                        background: pat.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 13,
                      color: pat.color,
                      width: 30,
                      textAlign: "right",
                    }}
                  >
                    {pat.count}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <h4
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: t.dim,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Key Insights
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  fontSize: 13,
                  color: t.muted,
                  lineHeight: 1.8,
                }}
              >
                {PATTERN_INSIGHTS.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>
          </Collapsible>

          <Collapsible
            title="Findings Timeline"
            subtitle="When issues were discovered"
          >
            <div style={{ position: "relative", paddingLeft: 20 }}>
              <div
                style={{
                  position: "absolute",
                  left: 6,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  background: t.border,
                }}
              />
              {[
                {
                  date: "2026-03-12",
                  label: "Backend audit",
                  count: 31,
                  color: t.purple,
                },
                {
                  date: "2026-03-13",
                  label: "Cross-project audit",
                  count: 19,
                  color: t.yellow,
                },
              ].map((entry) => (
                <div
                  key={entry.date}
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: 12,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: entry.color,
                      border: `2px solid ${t.bg}`,
                      position: "absolute",
                      left: -20,
                      top: 4,
                      zIndex: 1,
                    }}
                  />
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span
                        style={{
                          fontFamily: t.mono,
                          fontSize: 12,
                          color: t.dim,
                        }}
                      >
                        {entry.date}
                      </span>
                      <Badge color={entry.color}>{entry.count} findings</Badge>
                    </div>
                    <span style={{ fontSize: 13, color: t.muted }}>
                      {entry.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Collapsible>
        </Section>

        {/* ── 08 Tooling & Workflow ── */}
        <Section id="tooling" number="08" title="Tooling & Workflow">
          {TOOLING.map((group) => (
            <Collapsible
              key={group.category}
              title={group.category}
              subtitle={`${group.items.length} items`}
              defaultOpen={group.category === "Available Now"}
            >
              {group.items.map((item) => {
                const statusColor =
                  item.status === "available"
                    ? t.green
                    : item.status === "planned"
                      ? t.yellow
                      : t.red;
                return (
                  <div
                    key={item.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: `1px solid ${t.border}`,
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge color={statusColor}>{item.status}</Badge>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: t.text,
                      }}
                    >
                      {item.name}
                    </span>
                    <span style={{ fontSize: 12, color: t.muted }}>
                      {item.detail}
                    </span>
                  </div>
                );
              })}
            </Collapsible>
          ))}
        </Section>

        {/* ── 09 Overall Progress ── */}
        <Section id="progress" number="09" title="Overall Progress">
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                fontSize: 13,
              }}
            >
              <span style={{ color: t.muted }}>
                {completedCount} completed / {totalCount} total findings
              </span>
              <span style={{ fontFamily: t.mono, color: t.accent }}>
                {totalCount > 0
                  ? Math.round((completedCount / totalCount) * 100)
                  : 0}
                %
              </span>
            </div>

            {/* Multi-segment progress bar */}
            <div
              style={{
                height: 28,
                borderRadius: 6,
                overflow: "hidden",
                display: "flex",
                background: t.border,
              }}
            >
              {completedCount > 0 && (
                <div
                  style={{
                    width: `${(completedCount / totalCount) * 100}%`,
                    background: t.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    {completedCount} done
                  </span>
                </div>
              )}
              {p1Open.length > 0 && (
                <div
                  style={{
                    width: `${(p1Open.length / totalCount) * 100}%`,
                    background: t.red,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: t.mono,
                    }}
                  >
                    P1: {p1Open.length}
                  </span>
                </div>
              )}
              {p2Open.length > 0 && (
                <div
                  style={{
                    width: `${(p2Open.length / totalCount) * 100}%`,
                    background: t.yellow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                    P2: {p2Open.length}
                  </span>
                </div>
              )}
              {p3Open.length > 0 && (
                <div
                  style={{
                    width: `${(p3Open.length / totalCount) * 100}%`,
                    background: t.purple,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#fff",
                      fontFamily: t.mono,
                    }}
                  >
                    P3: {p3Open.length}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 16,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {[
                {
                  label: "Completed",
                  count: completedCount,
                  color: t.green,
                },
                { label: "P1 Critical", count: p1Open.length, color: t.red },
                { label: "P2 Important", count: p2Open.length, color: t.yellow },
                {
                  label: "P3 Nice-to-have",
                  count: p3Open.length,
                  color: t.purple,
                },
              ].map((seg) => (
                <div
                  key={seg.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: seg.color,
                    }}
                  />
                  <span style={{ color: t.muted }}>
                    {seg.label}: {seg.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ── 10a P1 Critical ── */}
        <Section id="p1" number="10" title="P1 — Critical">
          <div
            style={{
              marginBottom: 8,
              fontSize: 13,
              color: t.red,
              fontFamily: t.mono,
            }}
          >
            {p1Open.length} open · {p1Done.length} completed ·{" "}
            {P1_FINDINGS.length} total
          </div>

          {p1Open.length > 0 && (
            <Card style={{ padding: 0, marginBottom: 12 }}>
              {p1Open.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </Card>
          )}

          {p1Done.length > 0 && (
            <Collapsible
              title={`${p1Done.length} Completed P1 Items`}
              subtitle="Resolved"
            >
              {p1Done.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </Collapsible>
          )}
        </Section>

        {/* ── 10b P2 Important ── */}
        <Section id="p2" number="" title="P2 — Important">
          <div
            style={{
              marginBottom: 8,
              fontSize: 13,
              color: t.yellow,
              fontFamily: t.mono,
            }}
          >
            {p2Open.length} open · {p2Done.length} completed ·{" "}
            {P2_FINDINGS.length} total
          </div>

          {p2Open.length > 0 && (
            <Card style={{ padding: 0, marginBottom: 12 }}>
              {p2Open.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </Card>
          )}

          {p2Done.length > 0 && (
            <Collapsible
              title={`${p2Done.length} Completed P2 Items`}
              subtitle="Resolved"
            >
              {p2Done.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </Collapsible>
          )}
        </Section>

        {/* ── 10c P3 Nice-to-have ── */}
        <Section id="p3" number="" title="P3 — Nice-to-have">
          <div
            style={{
              marginBottom: 8,
              fontSize: 13,
              color: t.purple,
              fontFamily: t.mono,
            }}
          >
            {p3Open.length} open · {p3Done.length} completed ·{" "}
            {P3_FINDINGS.length} total
          </div>

          {p3Open.length > 0 && (
            <Collapsible
              title={`${p3Open.length} Open P3 Items`}
              subtitle="Cleanup and improvements"
              defaultOpen
            >
              {p3Open.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </Collapsible>
          )}

          {p3Done.length > 0 && (
            <Collapsible
              title={`${p3Done.length} Completed P3 Items`}
              subtitle="Resolved"
            >
              {p3Done.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </Collapsible>
          )}
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
          {totalCount} tracked findings · {openCount} open · {completedCount}{" "}
          completed · Data sourced from todos/ directories
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <a
            href="/tech"
            style={{ color: t.accent, textDecoration: "none", fontSize: 12 }}
          >
            Under the Hood
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
