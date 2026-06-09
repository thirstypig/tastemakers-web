"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "open" | "in_progress" | "done";
type Phase = "P1" | "P2" | "P3";
type Platform = "backend" | "ios" | "android" | "web" | "marketing";

const STATUS_ICON: Record<Status, string> = {
  open: "○",
  in_progress: "◐",
  done: "●",
};

interface TodoItem {
  id: string;
  platform: Platform;
  title: string;
  phase: Phase;
  status: Status;
  detail: string;
  file?: string;
  date: string;
}

const TODO_ITEMS: TodoItem[] = [
  // ── Backend P1 ──────────────────────────────────
  {
    id: "b-foursquare-key",
    platform: "backend",
    title: "Set FOURSQUARE_API_KEY in Railway env vars",
    phase: "P1",
    status: "open",
    detail: "Go to Railway → Project → tastemakers-backend service → Variables → add FOURSQUARE_API_KEY. Without it every call to /api/restaurants returns 500.",
    file: "Railway dashboard → Variables",
    date: "",
  },
  {
    id: "b-debug-routes",
    platform: "backend",
    title: "Remove /debug-schema, /run-schema-fix, /debug-signup from routes/web.php",
    phase: "P1",
    status: "open",
    detail: "These scaffolding routes are still live in production. /debug-schema exposes DB column names. /debug-signup creates real users and issues Passport tokens via GET. /run-schema-fix runs raw ALTER TABLE without auth.",
    file: "routes/web.php",
    date: "",
  },
  {
    id: "b-apple-jwt",
    platform: "backend",
    title: "Verify Apple Sign-In JWT in AuthController::appleLogin()",
    phase: "P1",
    status: "open",
    detail: "appleLogin() accepts any token without verifying the signature against Apple's public keys. Should fetch https://appleid.apple.com/auth/keys and validate the JWT.",
    file: "app/Http/Controllers/AuthController.php",
    date: "",
  },
  {
    id: "b-badges-user",
    platform: "backend",
    title: "Fix getallBadges() hardcoded user_id=43",
    phase: "P1",
    status: "open",
    detail: "The badges query uses a hardcoded user_id=43 instead of Auth::id(). Any authenticated user sees badges for user 43.",
    file: "app/Http/Controllers/UserController.php",
    date: "",
  },
  {
    id: "b-fcm-regression",
    platform: "backend",
    title: "Audit FCM key usage after refactor",
    phase: "P1",
    status: "open",
    detail: "FCM server key was moved to config('services.fcm.server_key') in the security sprint. Verify UserController no longer has any hardcoded fallback.",
    file: "app/Http/Controllers/UserController.php",
    date: "",
  },
  // ── Backend P2 ──────────────────────────────────
  {
    id: "b-form-request",
    platform: "backend",
    title: "Add FormRequest classes to replace inline validation",
    phase: "P2",
    status: "open",
    detail: "Controllers use manual Validator::make() calls. Replace with dedicated FormRequest classes for login, signup, profile update, restaurant save.",
    file: "app/Http/Requests/",
    date: "",
  },
  {
    id: "b-rate-limit",
    platform: "backend",
    title: "Add throttle middleware to auth endpoints",
    phase: "P2",
    status: "open",
    detail: "Add throttle:10,1 to /api/login, /api/signup, /api/google-login, /api/apple-login in routes/api.php.",
    file: "routes/api.php",
    date: "",
  },
  {
    id: "b-exception-handler",
    platform: "backend",
    title: "Re-enable JSON exception handler",
    phase: "P2",
    status: "open",
    detail: "Handler.php exception rendering is commented out. API clients receive HTML error pages instead of JSON when exceptions occur.",
    file: "app/Exceptions/Handler.php",
    date: "",
  },
  {
    id: "b-token-ttl",
    platform: "backend",
    title: "Set Passport personal access token TTL to 90 days",
    phase: "P2",
    status: "open",
    detail: "Default is 1 year. Call Passport::personalAccessTokensExpireIn(CarbonInterval::days(90)) in AuthServiceProvider::boot().",
    file: "app/Providers/AuthServiceProvider.php",
    date: "",
  },
  // ── iOS P1 ──────────────────────────────────────
  {
    id: "ios-api-url",
    platform: "ios",
    title: "Update Constant.swift API base URL",
    phase: "P1",
    status: "open",
    detail: "Change BASE_URL from https://tastemakersapp.com/v2/api/ to https://api.tastemakersapp.com/api/. Requires App Store submission after change — coordinate with backend deploy confirmation first.",
    file: "tastemakers-ios/Tastemakers/Utils/Constant.swift",
    date: "",
  },
  // ── iOS P2 ──────────────────────────────────────
  {
    id: "ios-keychain",
    platform: "ios",
    title: "Move auth token from UserDefaults to Keychain",
    phase: "P2",
    status: "open",
    detail: "Token in UserDefaults is readable by any process on a jailbroken device. Use KeychainWrapper or Security framework SecItemAdd/SecItemCopyMatching.",
    file: "tastemakers-ios/Tastemakers/",
    date: "",
  },
  // ── iOS P3 ──────────────────────────────────────
  {
    id: "ios-boundary",
    platform: "ios",
    title: "Fix multipart upload double boundary",
    phase: "P3",
    status: "open",
    detail: "Image upload requests include the boundary string twice in the Content-Type header, causing some servers to reject the request.",
    date: "",
  },
  {
    id: "ios-typo",
    platform: "ios",
    title: "Bulk rename complition → completion",
    phase: "P3",
    status: "open",
    detail: "The typo 'complition' appears in method names, variable names, and comments throughout the iOS codebase. grep -r complition to find all occurrences.",
    date: "",
  },
  // ── Android P1 ──────────────────────────────────
  {
    id: "and-hilt",
    platform: "android",
    title: "Add @HiltAndroidApp Application class",
    phase: "P1",
    status: "open",
    detail: "Android won't compile without a class annotated @HiltAndroidApp and declared as android:name in AndroidManifest.xml. Create TastemakersApp.kt and register it.",
    file: "tastemakers-android/app/src/main/java/.../TastemakersApp.kt",
    date: "",
  },
  {
    id: "and-firebase",
    platform: "android",
    title: "Remove Firebase deps until google-services.json exists",
    phase: "P1",
    status: "open",
    detail: "google-services.json is missing but Firebase dependencies are in build.gradle, causing compilation failure. Comment out or remove Firebase until the file is added.",
    file: "tastemakers-android/app/build.gradle",
    date: "",
  },
  // ── Android P2 ──────────────────────────────────
  {
    id: "and-fields",
    platform: "android",
    title: "Fix tag + follow API request field names",
    phase: "P2",
    status: "open",
    detail: "Android sends wrong field names for POST /api/restaurant-tag and /api/tastemaker-follow. Should match iOS: tag_id not tagId, tastemaker_id not tastemakerId.",
    date: "",
  },
  {
    id: "and-parity",
    platform: "android",
    title: "Port core feature set from iOS (auth, restaurants, tastemakers)",
    phase: "P2",
    status: "open",
    detail: "Android is at 135 LOC with no real screens. Needs Google Sign-In, restaurant browse, tastemaker list, and basic profile screen at minimum to match iOS.",
    date: "",
  },
  // ── Web P2 ──────────────────────────────────────
  {
    id: "web-password-reset",
    platform: "web",
    title: "Build password reset + email verification flow",
    phase: "P2",
    status: "open",
    detail: "Supabase handles password reset via email. Add /auth/reset-password page that reads the Supabase token from URL hash, validates it, and updates password via supabase.auth.updateUser().",
    file: "src/app/auth/reset-password/page.tsx",
    date: "",
  },
  {
    id: "web-profile",
    platform: "web",
    title: "Build /profile page with edit form",
    phase: "P2",
    status: "open",
    detail: "Auth-gated page using Supabase session. Display name, bio, avatar. Edit form calls POST /api/update-profile via the proxied Laravel API. Avatar upload to Supabase Storage.",
    file: "src/app/(authenticated)/profile/page.tsx",
    date: "",
  },
  {
    id: "web-access-tiers",
    platform: "web",
    title: "Enforce user access tiers in middleware",
    phase: "P2",
    status: "open",
    detail: "Anonymous: read-only browse. Registered: save restaurants, tag, create lists. Gate write actions in middleware.ts and show auth prompt for anonymous users.",
    file: "src/middleware.ts",
    date: "",
  },
  {
    id: "web-real-data",
    platform: "web",
    title: "Swap stub layer for real Laravel API data",
    phase: "P2",
    status: "open",
    detail: "src/lib/api/index.ts returns stub data. Replace getTastemaker(), getList(), getRestaurant() with real apiFetch() calls once /api/restaurants and /api/gettastemaker-List work.",
    file: "src/lib/api/index.ts",
    date: "",
  },
  // ── Marketing P1 ────────────────────────────────
  {
    id: "mkt-502",
    platform: "marketing",
    title: "Diagnose and fix www.tastemakersapp.com 502",
    phase: "P1",
    status: "open",
    detail: "Was returning 502 last checked 2026-05-11. Check Railway deployment logs for tastemakers-marketing service. Likely Caddy config or static file serving issue.",
    file: "tastemakers-marketing/Caddyfile",
    date: "",
  },
  // ── Marketing P2 ────────────────────────────────
  {
    id: "mkt-content",
    platform: "marketing",
    title: "Build content pages for AdSense review",
    phase: "P2",
    status: "open",
    detail: "AdSense rejected thin one-page sites. Need: About page, How It Works, city-specific restaurant guides (NYC, LA, Chicago), and at minimum 5-6 editorial posts before reapplying.",
    date: "",
  },
];

const PLATFORM_COLORS: Record<Platform, string> = {
  backend: "var(--tm-muted)",
  ios: "var(--tm-accent)",
  android: "#facc15",
  web: "var(--tm-accent)",
  marketing: "#a78bfa",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  backend: "Backend / API",
  ios: "iOS",
  android: "Android",
  web: "Web App",
  marketing: "Marketing",
};

function phaseColor(phase: Phase) {
  if (phase === "P1") return "var(--tm-err)";
  if (phase === "P2") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

function statusColor(s: Status) {
  if (s === "done") return "var(--tm-accent)";
  if (s === "in_progress") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

const ALL_PLATFORMS: Platform[] = ["backend", "ios", "android", "web", "marketing"];
const ALL_PHASES: Phase[] = ["P1", "P2", "P3"];

export default function TodoPage() {
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterPhase, setFilterPhase] = useState<Phase | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("open");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  function toggleItem(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = TODO_ITEMS.filter(
    (item) =>
      (filterPlatform === "all" || item.platform === filterPlatform) &&
      (filterPhase === "all" || item.phase === filterPhase) &&
      (filterStatus === "all" || item.status === filterStatus),
  );

  const openCount = TODO_ITEMS.filter((i) => i.status !== "done").length;
  const p1Count = TODO_ITEMS.filter((i) => i.phase === "P1" && i.status !== "done").length;

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
          { label: "roadmap.md", active: false, href: "/admin/roadmap" },
          { label: "todo.md", active: true, href: "/admin/todo" },
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
        <div style={{ color: "var(--tm-muted)", marginBottom: 14, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> cat todo.md
        </div>

        {/* Summary + filter row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Stats */}
          <div
            style={{
              padding: "6px 12px",
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
              fontSize: 11,
              display: "flex",
              gap: 14,
            }}
          >
            <span>
              <span style={{ color: "var(--tm-err)", fontWeight: 600 }}>{p1Count}</span>
              <span style={{ color: "var(--tm-muted)" }}> P1</span>
            </span>
            <span>
              <span style={{ color: "var(--tm-ink)", fontWeight: 600 }}>{openCount}</span>
              <span style={{ color: "var(--tm-muted)" }}> open</span>
            </span>
            <span>
              <span style={{ color: "var(--tm-muted)" }}>{filtered.length} shown</span>
            </span>
          </div>

          {/* Platform filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", ...ALL_PLATFORMS] as const).map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlatform(p)}
                style={{
                  padding: "4px 8px",
                  fontSize: 10.5,
                  background: filterPlatform === p ? "var(--tm-accent-bg)" : "transparent",
                  border: `1px solid ${filterPlatform === p ? "var(--tm-accent)" : "var(--tm-line)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  color: filterPlatform === p ? "var(--tm-accent)" : "var(--tm-muted)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {p === "all" ? "all" : p}
              </button>
            ))}
          </div>

          {/* Phase filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", ...ALL_PHASES] as const).map((ph) => (
              <button
                key={ph}
                onClick={() => setFilterPhase(ph)}
                style={{
                  padding: "4px 8px",
                  fontSize: 10.5,
                  background: filterPhase === ph ? "var(--tm-accent-bg)" : "transparent",
                  border: `1px solid ${filterPhase === ph ? phaseColor(ph as Phase) : "var(--tm-line)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  color: filterPhase === ph ? phaseColor(ph as Phase) : "var(--tm-muted)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {ph}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "open", "in_progress", "done"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "4px 8px",
                  fontSize: 10.5,
                  background: filterStatus === s ? "var(--tm-accent-bg)" : "transparent",
                  border: `1px solid ${filterStatus === s ? "var(--tm-accent)" : "var(--tm-line)"}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  color: filterStatus === s ? "var(--tm-accent)" : "var(--tm-muted)",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                {s === "in_progress" ? "in-progress" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Todo items */}
        <div
          style={{
            background: "var(--tm-panel)",
            border: "1px solid var(--tm-line)",
            borderRadius: 6,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "20px 14px",
                color: "var(--tm-muted)",
                fontSize: 11.5,
                textAlign: "center",
              }}
            >
              no items match filters
            </div>
          ) : (
            filtered.map((item, i) => {
              const isExpanded = expandedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    borderBottom:
                      i === filtered.length - 1 ? "none" : "1px solid var(--tm-line)",
                  }}
                >
                  {/* Main row */}
                  <div
                    style={{
                      padding: "8px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 11.5,
                    }}
                  >
                    <span style={{ color: statusColor(item.status), fontSize: 12, flexShrink: 0 }}>
                      {STATUS_ICON[item.status]}
                    </span>

                    <span
                      style={{
                        fontSize: 10,
                        color: PLATFORM_COLORS[item.platform],
                        border: `1px solid ${PLATFORM_COLORS[item.platform]}`,
                        borderRadius: 3,
                        padding: "1px 5px",
                        flexShrink: 0,
                        opacity: 0.85,
                      }}
                    >
                      {item.platform}
                    </span>

                    <span
                      style={{
                        flex: 1,
                        color: item.status === "done" ? "var(--tm-muted)" : "var(--tm-ink)",
                        textDecoration: item.status === "done" ? "line-through" : "none",
                      }}
                    >
                      {item.title}
                    </span>

                    {item.file && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--tm-muted)",
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                        title={item.file}
                      >
                        {item.file.split("/").slice(-1)[0] || item.file}
                      </span>
                    )}

                    <span
                      style={{
                        fontSize: 10,
                        color: phaseColor(item.phase),
                        border: `1px solid ${phaseColor(item.phase)}`,
                        borderRadius: 3,
                        padding: "1px 5px",
                        flexShrink: 0,
                      }}
                    >
                      {item.phase}
                    </span>

                    <button
                      onClick={() => toggleItem(item.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--tm-muted)",
                        fontSize: 10.5,
                        padding: "0 4px",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        flexShrink: 0,
                      }}
                    >
                      {isExpanded ? "▴" : "▾"}
                    </button>
                  </div>

                  {/* Detail row */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: "0 14px 10px 14px",
                        marginLeft: 22,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--tm-muted)",
                          lineHeight: 1.7,
                          padding: "8px 12px",
                          background: "var(--tm-bg)",
                          borderRadius: 4,
                          borderLeft: "2px solid var(--tm-line)",
                        }}
                      >
                        {item.detail}
                        {item.file && (
                          <div style={{ marginTop: 6, color: "var(--tm-accent)", fontSize: 10.5 }}>
                            file: {item.file}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--tm-muted)" }}>
          macro milestones in{" "}
          <Link href="/admin/roadmap" style={{ color: "var(--tm-accent)", textDecoration: "none" }}>
            roadmap.md →
          </Link>
        </div>
      </div>
    </div>
  );
}
