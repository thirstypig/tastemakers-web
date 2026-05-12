import Link from "next/link";

type PlatformId = "ios" | "android" | "web" | "api";

const PLATFORM_DATA: Record<
  PlatformId,
  {
    name: string;
    version: string;
    users: string;
    status: string;
    tech: string;
    crashFree: string;
    lastRelease: string;
    todos: { priority: string; title: string; status: string }[];
    commits: { sha: string; date: string; subject: string }[];
    routes: string[];
  }
> = {
  ios: {
    name: "iOS",
    version: "2.14.0",
    users: "8,402",
    status: "live",
    tech: "Swift / UIKit",
    crashFree: "99.2%",
    lastRelease: "2026-04-10",
    todos: [
      { priority: "P1", title: "Fix multipart Content-Type boundary mismatch", status: "open" },
      { priority: "P1", title: "Move Bearer token from UserDefaults to Keychain", status: "open" },
      { priority: "P2", title: "Fix double completion callback in getProfileAPI", status: "open" },
      { priority: "P2", title: "Update API URL to api.tastemakersapp.com", status: "open" },
      { priority: "P3", title: "Fix otherUser enum case baking query string into path", status: "open" },
      { priority: "P3", title: "Delete arrayToNSData and makeNetworkActivityHidden (dead)", status: "open" },
    ],
    commits: [
      { sha: "a1b2c3d", date: "2026-04-10", subject: "bump version to 2.14.0" },
      { sha: "e4f5g6h", date: "2026-03-22", subject: "fix profile image upload flow" },
      { sha: "i7j8k9l", date: "2026-03-15", subject: "add Apple Sign-In support" },
      { sha: "m0n1o2p", date: "2026-03-01", subject: "update Foursquare API endpoints" },
    ],
    routes: [
      "POST /api/login", "POST /api/apple-login", "GET /api/user",
      "POST /api/restaurant-save", "POST /api/restaurant-tag", "GET /api/restaurants",
      "GET /api/gettastemaker-List", "POST /api/ListTitleSave",
    ],
  },
  android: {
    name: "Android",
    version: "0.9.2",
    users: "1,981",
    status: "beta",
    tech: "Kotlin / Jetpack Compose",
    crashFree: "—",
    lastRelease: "2026-02-01",
    todos: [
      { priority: "P1", title: "Create Hilt DI module (app won't compile)", status: "open" },
      { priority: "P1", title: "Fix AuthResponse envelope mismatch (login broken)", status: "open" },
      { priority: "P2", title: "Fix TagRestaurantRequest field names", status: "open" },
      { priority: "P2", title: "Fix FollowRequest wrong key (tastemaker_id vs testmaker_id)", status: "open" },
      { priority: "P2", title: "Add nearbycuisine endpoint to API interface", status: "open" },
      { priority: "P3", title: "Set allowBackup=false in AndroidManifest", status: "open" },
      { priority: "P3", title: "Migrate kapt to KSP", status: "open" },
    ],
    commits: [
      { sha: "q3r4s5t", date: "2026-02-01", subject: "scaffold Jetpack Compose navigation" },
      { sha: "u6v7w8x", date: "2026-01-20", subject: "add Retrofit API interface" },
      { sha: "y9z0a1b", date: "2026-01-10", subject: "initial Hilt setup (incomplete)" },
    ],
    routes: [
      "POST /api/login", "POST /api/google-login", "GET /api/user",
      "GET /api/restaurants", "POST /api/restaurant-save",
    ],
  },
  web: {
    name: "Web",
    version: "0.4.1",
    users: "2,464",
    status: "staging",
    tech: "Next.js 15 / TypeScript",
    crashFree: "—",
    lastRelease: "2026-05-11",
    todos: [
      { priority: "P1", title: "Admin login token path mismatch (data.token vs data.data.token)", status: "open" },
      { priority: "P2", title: "Move Bearer token from localStorage to httpOnly cookie", status: "open" },
      { priority: "P2", title: "Fix TastemakerList.name → list_name field mismatch", status: "open" },
      { priority: "P3", title: "Add TypeScript null safety for nullable API fields", status: "open" },
    ],
    commits: [
      { sha: "c2d3e4f", date: "2026-05-11", subject: "add terminal admin dashboard" },
      { sha: "g5h6i7j", date: "2026-05-04", subject: "add status, analytics, changelog pages" },
      { sha: "k8l9m0n", date: "2026-04-22", subject: "add roadmap page with 49 findings" },
      { sha: "o1p2q3r", date: "2026-04-15", subject: "initial Next.js 15 scaffold" },
    ],
    routes: [
      "POST /api/login", "GET /api/user", "GET /api/restaurants",
      "GET /api/tags", "GET /api/gettastemaker-List",
    ],
  },
  api: {
    name: "API",
    version: "8.6.3",
    users: "—",
    status: "live",
    tech: "Laravel 8 / PostgreSQL",
    crashFree: "99.66%",
    lastRelease: "2026-05-11",
    todos: [
      { priority: "P1", title: "Remove debug routes from web.php (/debug-signup, /run-schema-fix)", status: "open" },
      { priority: "P1", title: "Remove hardcoded FCM key from UserController.php:561", status: "open" },
      { priority: "P1", title: "Fix Apple Sign-In JWT — base64 decode only, no signature verify", status: "open" },
      { priority: "P2", title: "Wrap multi-step writes in DB::transaction()", status: "open" },
      { priority: "P2", title: "Uncomment JSON exception handler in Handler.php", status: "open" },
      { priority: "P2", title: "Set Passport::tokensExpireIn() (currently 1 year)", status: "open" },
    ],
    commits: [
      { sha: "s4t5u6v", date: "2026-05-11", subject: "remove FCM key, fix mass assignment" },
      { sha: "w7x8y9z", date: "2026-05-04", subject: "Railway deployment + Passport env keys" },
      { sha: "a0b1c2d", date: "2026-04-22", subject: "add PHPUnit feature tests" },
      { sha: "e3f4g5h", date: "2026-04-01", subject: "migrate to PostgreSQL / Supabase" },
    ],
    routes: ["all"],
  },
};

function statusColor(s: string) {
  if (s === "live") return "var(--tm-accent)";
  if (s === "beta") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

function priorityColor(p: string) {
  if (p === "P1") return "var(--tm-err)";
  if (p === "P2") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const platform = PLATFORM_DATA[id as PlatformId];

  if (!platform) {
    return (
      <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
        <span style={{ color: "var(--tm-err)" }}>platform not found: {id}</span>
      </div>
    );
  }

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
          { label: `${id}.tsx`, active: true, href: `/admin/platforms/${id}` },
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

      <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
        <div style={{ color: "var(--tm-muted)", marginBottom: 16, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm platform {id} --stats
        </div>

        {/* Stats KPIs */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}># stats</div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {[
              { label: "version", value: platform.version },
              { label: "users", value: platform.users },
              { label: "status", value: `● ${platform.status}`, color: statusColor(platform.status) },
              { label: "tech", value: platform.tech },
              { label: "crash_free", value: platform.crashFree },
              { label: "last_release", value: platform.lastRelease },
            ].map((k, i, arr) => (
              <div
                key={k.label}
                style={{
                  padding: "7px 14px",
                  borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--tm-line)",
                  fontSize: 11.5,
                  display: "flex",
                }}
              >
                <span style={{ display: "inline-block", width: 170, color: "var(--tm-muted)" }}>
                  {k.label}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: k.color ?? "var(--tm-ink)",
                  }}
                >
                  {k.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column: todos | commits */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {/* Todos */}
          <div>
            <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
              # todos.md ({platform.todos.length})
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {platform.todos.map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: "7px 14px",
                    borderBottom:
                      i === platform.todos.length - 1 ? "none" : "1px solid var(--tm-line)",
                    fontSize: 11.5,
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ color: priorityColor(t.priority), fontWeight: 600, flexShrink: 0 }}>
                    [{t.priority}]
                  </span>
                  <span style={{ color: "var(--tm-ink)" }}>○ {t.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commits */}
          <div>
            <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
              # recent commits
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {platform.commits.map((c, i) => (
                <div
                  key={c.sha}
                  style={{
                    padding: "7px 14px",
                    borderBottom:
                      i === platform.commits.length - 1 ? "none" : "1px solid var(--tm-line)",
                    fontSize: 11.5,
                  }}
                >
                  <span style={{ color: "var(--tm-muted)" }}>{c.date}</span>{" "}
                  <span style={{ color: "var(--tm-accent)" }}>{c.sha}</span>{" "}
                  <span style={{ color: "var(--tm-ink)" }}>{c.subject}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API routes used */}
        <div>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
            # api routes used
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {platform.routes.map((r, i) => (
              <div
                key={r}
                style={{
                  padding: "7px 14px",
                  borderBottom:
                    i === platform.routes.length - 1 ? "none" : "1px solid var(--tm-line)",
                  fontSize: 11.5,
                  color: "var(--tm-muted)",
                }}
              >
                <span style={{ color: "var(--tm-accent)" }}>→</span> {r}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
