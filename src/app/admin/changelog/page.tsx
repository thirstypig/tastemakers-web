import Link from "next/link";

const RELEASES = [
  {
    v: "v9.0.0",
    date: "2026-07-24",
    title: "Docs knowledge base, auto-walking viewer, and the archaeology findings",
    items: [
      { type: "+", text: "docs/ knowledge base established: frontmatter convention (id/type/status/tags/links), 14-tag controlled vocabulary, ID scheme (PRD/ADR/DOC/RISK/EXP/SOL/TODO), 9 board sections organised by reader question — spec in docs/README-DOCS.md" },
      { type: "~", text: "/admin/docs rebuilt AGAIN: the hand-maintained DOCS_REGISTRY whitelist is gone, replaced by an auto-walker over docs/ — frontmatter drives section, H1 drives title (with a code-fence + HTML-comment guard so a `# comment` inside a bash block can't become the title). Add a doc, it appears. 38 docs indexed." },
      { type: "+", text: "Viewer UX: search over title/id/path/tag, per-section purpose blurbs, status badges including shipped-vs-planned on PRDs, wider sidebar with hover tooltips, generated-doc banner" },
      { type: "+", text: "4 PRDs written — tagging + badges reconstructed retroactively from code with every claim tagged [intended]/[inferred]/[unknown]; account-deletion + search written forward-looking. Plus ADR-001 (feature module isolation, 7-module map), launch spec, intake gate, glossary, roadmap, to-dos, priority map" },
      { type: "+", text: "Living docs: scripts/refresh-docs.mjs generates stats/costs/system-status and rewrites the status block in README + CLAUDE.md between markers; scripts/sync-inbox.mjs drives the comment-inbox loop. npm run docs:refresh / docs:inbox" },
      { type: "-", text: "EXP-001 REFUTED: 86% of tagged restaurants have exactly one tagger, so tag votes have a hard ceiling of 1 — the consensus the product rests on does not exist in the data. Only 3.9% of restaurants could ever have reached 3 votes." },
      { type: "-", text: "UNIQUE(restaurant_id, tag_id) found ALREADY APPLIED in production and absent from the migrations table — every vote count is capped at 1, 759 ids missing from the sequence, and the second user to apply an existing tag gets an HTTP 500 today" },
      { type: "-", text: "Tagging activity down 98.5% from peak: 3,068 tags / 67 taggers in 2021 → 44 tags / 6 taggers in 2025. Logged as RISK-016; it outranks the technical backlog." },
      { type: "-", text: "getallBadges hardcodes user_id = 43 in three queries — every user sees user 43's badges; 19 MySQL-only IFNULL/IF() calls throw on PostgreSQL; searchByTags has no ORDER BY at all" },
      { type: "+", text: "Tests: 127 → 219 across 15 files. Added the docs registry/title-extraction suite (63), docs-generation script coverage (43), and a client/server boundary guard. vitest now includes scripts/**/*.test.mjs" },
      { type: "~", text: "Stats LOC corrected: the generator was counting 429,667 lines of vendored assets (the committed Metronic admin theme) as project code — real application source is ~81K, not 510K" },
    ],
  },
  {
    v: "v8.10.0",
    date: "2026-06-09",
    title: "Docs reorg + live dashboard",
    items: [
      { type: "~", text: "/admin/docs rebuilt: single DOCS_REGISTRY in src/lib/docs.ts drives index + viewer + static params — killed 5 desync 404s; docs grouped into 5 categories (planning/operations/product/reference/context)" },
      { type: "+", text: "New ops docs: operations.md (deploy/rollback/incident/env inventory), architecture.md (system map), metrics.md (KPI definitions); going-live.md refreshed (+blockers.md merged in, deleted); cross-todos.md regenerated; root-claude.md snapshot added" },
      { type: "+", text: "/admin landing dashboard rebuilt: 12-week trend sparkbars (users/restaurants/tags/saves), 30d trending-cities leaderboard with deltas, PostHog 7d web stats (cached 5min), merged activity feed (signups/tags/lists) — force-dynamic, Promise.allSettled failure-isolated" },
      { type: "~", text: "posthog.ts shared HogQL client extracted — analytics page refactored to use it; GITHUB_TOKEN optional env var for authenticated GitHub requests in docs viewer" },
      { type: "+", text: "22 new tests: trends.ts (5), city-stats.ts (4), activity-feed.ts (3), posthog.ts (3), docs.test.ts expanded — suite now 118 tests across 12 files" },
    ],
  },
  {
    v: "v8.9.4",
    date: "2026-06-09",
    title: "Admin style consistency pass + /todo page + test lib",
    items: [
      { type: "+", text: "/admin/todo — new page with 22 detailed implementation tasks filterable by platform (backend/ios/android/web/marketing), priority (P1/P2/P3), and status" },
      { type: "~", text: "Roadmap reorganized from flat P1/P2/P3 list to platform-grouped macro milestones with expandable detail notes" },
      { type: "~", text: "tech + status pages: replaced hardcoded dark tokens (#0f0f23) with CSS vars — light/dark theme toggle now applies consistently across all admin pages" },
      { type: "~", text: "tech + status pages: removed standalone sticky header/footer that was duplicating admin chrome; replaced with standard tab strip pattern" },
      { type: "~", text: "analytics page: service names are clickable links to GA4, PostHog, Search Console, AdSense dashboards; AdSense added to services list" },
      { type: "+", text: "admin-filters.ts — extracted filterTodos() + summarizeRoadmap() as shared pure lib; 13 unit tests covering AND-logic filter, 'all' sentinel, P1 counter excludes done items" },
    ],
  },
  {
    v: "v8.9.3",
    date: "2026-06-08",
    title: "Fix production OAuth login — Railway port + email allowlist",
    items: [
      { type: "~", text: "auth/callback: use NEXT_PUBLIC_SITE_URL as redirect origin — request.url inside Railway resolves to localhost:8080, not the public domain" },
      { type: "~", text: "Removed x-forwarded-host fallback (open redirect vulnerability — host header is client-controlled)" },
      { type: "~", text: "Root cause of loop-to-login: ADMIN_EMAILS in Railway had a typo (jimmyc316 vs jimmychang316) — corrected in Railway env vars" },
      { type: "+", text: "Production admin fully live: app.tastemakersapp.com/admin — login, users, restaurants, tags, platforms, analytics all working" },
    ],
  },
  {
    v: "v8.9.2",
    date: "2026-06-08",
    title: "Fix PostHog project ID + confirm analytics live",
    items: [
      { type: "~", text: "Analytics page: correct PostHog project ID from 348330 (Fantasy Leagues) → 455919 (Tastemakers)" },
      { type: "~", text: "PostHog write key corrected in env — tracking now active on Tastemakers project" },
      { type: "+", text: "Admin analytics page fully live: GA4 active, Plausible active, PostHog event counts rendering real data" },
    ],
  },
  {
    v: "v8.9.1",
    date: "2026-06-08",
    title: "Live platforms commits + real analytics service status",
    items: [
      { type: "+", text: "Platforms page: live commits from GitHub API for web (5min cache); private repos fall back to hardcoded" },
      { type: "+", text: "Platforms page: repo field shows public/private status per platform" },
      { type: "+", text: "Analytics page: GA4, Plausible, Search Console show real 'active/verified' status" },
      { type: "+", text: "Analytics page: PostHog event table (last 7d) when POSTHOG_PERSONAL_API_KEY is set" },
      { type: "~", text: "Analytics page: upgraded from stub placeholder to async Server Component with env-gated data" },
    ],
  },
  {
    v: "v8.9.0",
    date: "2026-06-07",
    title: "Live admin — real Supabase data, restaurants + tags pages",
    items: [
      { type: "+", text: "supabase-admin.ts — server-only service-role client; never bundled to browser" },
      { type: "+", text: "Admin overview wired to live KPIs: total_users, total_restaurants, total_tags, total_saves, total_tag_applications, total_lists" },
      { type: "+", text: "Admin overview: recent signups panel + top tags by usage (live)" },
      { type: "+", text: "/admin/users — real user table (email, name, username, is_testmaker flag, joined, last seen)" },
      { type: "+", text: "/admin/restaurants — real restaurant table with per-row save + tag counts" },
      { type: "+", text: "/admin/tags — real tag table sorted by usage with inline usage bar" },
      { type: "~", text: "Admin login: fixed post-OAuth redirect landing on /explore instead of /admin (missing ?next=/admin in redirectTo)" },
    ],
  },
  {
    v: "v8.8.2",
    date: "2026-06-04",
    title: "P1+P2 security & seeder hardening (26 todos resolved)",
    items: [
      { type: "~", text: "Auth: move delete endpoints behind auth:api; throttle:5,1 on login/signup/forgot-password" },
      { type: "~", text: "FCM hardcoded key → config('services.fcm.server_key'); env() → config() in RestaurantController" },
      { type: "~", text: "Production: restaurant_tag.user_id nullable; UNIQUE(restaurant_id,tag_id) + UNIQUE(tags.name) on Supabase" },
      { type: "~", text: "TagSeederService: prompt sanitization, placeId URL encode, embedding float validation, hasCandidates hoist, pgvector lateral query, TAG_REGEX 3-char min, tags_invalid counter split, expires_at scope" },
      { type: "~", text: "Tag model: users() scoped to source='user'; global expires_at scope; author_name removed (GDPR)" },
    ],
  },
  {
    v: "v8.8.1",
    date: "2026-06-04",
    title: "Tag seeding pipeline deep review",
    items: [
      { type: "+", text: "21 new backend todos filed (046–066) from 7-agent parallel code review" },
      { type: "!", text: "P1: .env_bkp with DB + SMTP passwords committed to git — rotate + purge required (046)" },
      { type: "!", text: "P1: RestaurantController pluck(user_id) passes NULL to WhereIn post-seeding (047)" },
      { type: "~", text: "Security findings: prompt injection, placeId URL risk, embedding validation, GDPR author_name (048–052, 060)" },
      { type: "~", text: "Performance findings: hasCandidates per-tag waste, pgvector double-eval (053–054)" },
    ],
  },
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
