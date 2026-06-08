import Link from "next/link";

const RELEASES = [
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
