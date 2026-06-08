import Link from "next/link";

type PlatformId = "ios" | "android" | "web" | "api";

// Only tastemakers-web is a public GitHub repo — others are private.
const GITHUB_REPOS: Partial<Record<PlatformId, string>> = {
  web: "thirstypig/tastemakers-web",
};

type Commit = { sha: string; date: string; subject: string };

async function fetchCommits(repo: string): Promise<Commit[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits?per_page=6`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return [];
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((c: any) => ({
      sha: (c.sha as string).slice(0, 7),
      date: (c.commit.author.date as string).slice(0, 10),
      subject: (c.commit.message as string).split("\n")[0].slice(0, 72),
    }));
  } catch {
    return [];
  }
}

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
    repoPublic: boolean;
    todos: { priority: string; title: string }[];
    fallbackCommits: Commit[];
    routes: string[];
  }
> = {
  ios: {
    name: "iOS",
    version: "2.14.0",
    users: "—",
    status: "live",
    tech: "Swift / UIKit",
    crashFree: "—",
    lastRelease: "2026-04-10",
    repoPublic: false,
    todos: [
      { priority: "P1", title: "Fix multipart Content-Type boundary mismatch" },
      { priority: "P1", title: "Move Bearer token from UserDefaults to Keychain" },
      { priority: "P2", title: "Fix double completion callback in getProfileAPI" },
      { priority: "P2", title: "Update API URL → api.tastemakersapp.com" },
      { priority: "P3", title: "Fix otherUser enum case baking query into path" },
      { priority: "P3", title: "Delete arrayToNSData + makeNetworkActivityHidden (dead code)" },
    ],
    fallbackCommits: [
      { sha: "a1b2c3d", date: "2026-04-10", subject: "bump version to 2.14.0" },
      { sha: "e4f5g6h", date: "2026-03-22", subject: "fix profile image upload flow" },
      { sha: "i7j8k9l", date: "2026-03-15", subject: "add Apple Sign-In support" },
    ],
    routes: [
      "POST /api/login", "POST /api/apple-login", "GET /api/user",
      "POST /api/restaurant-save", "POST /api/restaurant-tag",
      "GET /api/restaurants", "GET /api/gettastemaker-List", "POST /api/ListTitleSave",
    ],
  },
  android: {
    name: "Android",
    version: "0.9.2",
    users: "—",
    status: "beta",
    tech: "Kotlin / Jetpack Compose",
    crashFree: "—",
    lastRelease: "2026-02-01",
    repoPublic: false,
    todos: [
      { priority: "P1", title: "Create Hilt DI module (app won't compile)" },
      { priority: "P1", title: "Fix AuthResponse envelope mismatch (login broken)" },
      { priority: "P2", title: "Fix TagRestaurantRequest field names" },
      { priority: "P2", title: "Fix FollowRequest wrong key (tastemaker_id vs testmaker_id)" },
      { priority: "P2", title: "Add nearbycuisine endpoint to API interface" },
      { priority: "P3", title: "Set allowBackup=false in AndroidManifest" },
      { priority: "P3", title: "Migrate kapt → KSP" },
    ],
    fallbackCommits: [
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
    version: "v8.9.0",
    users: "—",
    status: "live",
    tech: "Next.js 15 / TypeScript",
    crashFree: "—",
    lastRelease: "2026-06-08",
    repoPublic: true,
    todos: [
      { priority: "P2", title: "Move Bearer token from localStorage to httpOnly cookie" },
      { priority: "P2", title: "Fix TastemakerList.name → list_name field mismatch" },
      { priority: "P3", title: "Add TypeScript null safety for nullable API fields" },
    ],
    fallbackCommits: [],
    routes: [
      "POST /api/login", "GET /api/user", "GET /api/restaurants",
      "GET /api/tags", "GET /api/gettastemaker-List",
    ],
  },
  api: {
    name: "API",
    version: "8.9.0",
    users: "—",
    status: "live",
    tech: "Laravel 8 / PostgreSQL",
    crashFree: "—",
    lastRelease: "2026-06-04",
    repoPublic: false,
    todos: [
      { priority: "P1", title: "Remove debug routes from web.php (/debug-signup, /run-schema-fix)" },
      { priority: "P1", title: "Fix Apple Sign-In JWT — base64 decode only, no signature verify" },
      { priority: "P2", title: "Wrap multi-step writes in DB::transaction()" },
      { priority: "P2", title: "Uncomment JSON exception handler in Handler.php" },
      { priority: "P2", title: "Set Passport::tokensExpireIn() (currently 1 year)" },
    ],
    fallbackCommits: [
      { sha: "5197215", date: "2026-06-04", subject: "chore: remove temporary admin token generator route" },
      { sha: "527196e", date: "2026-06-04", subject: "fix: harden temp admin token route (hash_equals + throttle)" },
      { sha: "974f0b2", date: "2026-06-04", subject: "temp: add one-time Budibase admin token generator route" },
      { sha: "eb25933", date: "2026-06-03", subject: "fix: resolve P1+P2 todos — security, seeder hardening" },
    ],
    routes: ["all — see /admin/routes"],
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

  const githubRepo = GITHUB_REPOS[id as PlatformId];
  const commits = githubRepo
    ? await fetchCommits(githubRepo)
    : platform.fallbackCommits;

  const commitsFromGitHub = githubRepo && commits.length > 0;

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

        {/* Stats */}
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
              { label: "status", value: `● ${platform.status}`, color: statusColor(platform.status) },
              { label: "tech", value: platform.tech },
              { label: "crash_free", value: platform.crashFree },
              { label: "last_release", value: platform.lastRelease },
              { label: "repo", value: githubRepo ?? "private", color: githubRepo ? "var(--tm-accent)" : "var(--tm-muted)" },
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
                <span style={{ display: "inline-block", width: 140, color: "var(--tm-muted)" }}>
                  {k.label}
                </span>
                <span style={{ fontWeight: 600, color: k.color ?? "var(--tm-ink)" }}>
                  {k.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Todos | Commits */}
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
              # todos ({platform.todos.length})
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
                    borderBottom: i === platform.todos.length - 1 ? "none" : "1px solid var(--tm-line)",
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
              # recent commits{commitsFromGitHub ? " · github.com/live" : " · hardcoded"}
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {commits.length === 0 ? (
                <TRow last>
                  <span style={{ color: "var(--tm-muted)" }}>no commits available</span>
                </TRow>
              ) : (
                commits.map((c, i) => (
                  <TRow key={c.sha} last={i === commits.length - 1}>
                    <span style={{ color: "var(--tm-muted)", marginRight: 8 }}>{c.date}</span>
                    <span style={{ color: "var(--tm-accent)", marginRight: 8 }}>{c.sha}</span>
                    <span style={{ color: "var(--tm-ink)" }}>{c.subject}</span>
                  </TRow>
                ))
              )}
            </div>
          </div>
        </div>

        {/* API routes */}
        <div>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}># api routes used</div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {platform.routes.map((r, i) => (
              <TRow key={r} last={i === platform.routes.length - 1}>
                <span style={{ color: "var(--tm-accent)" }}>→</span>{" "}
                <span style={{ color: "var(--tm-muted)" }}>{r}</span>
              </TRow>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
