import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import { bucketByWeek } from "@/lib/trends";
import { cityLeaderboard, type CityEvent } from "@/lib/city-stats";
import { mergeFeed, type FeedItem } from "@/lib/activity-feed";
import { fetchWebStats } from "@/lib/posthog";

// Admin dashboard must reflect live data on every request — never ISR-frozen
export const dynamic = "force-dynamic";

const TREND_WEEKS = 12;

async function getKpis() {
  const db = createAdminClient();
  const [users, restaurants, tags, saves, tagApps, lists] = await Promise.all([
    db.from("users").select("*", { count: "exact", head: true }).is("deleted_at", null),
    db.from("restaurants").select("*", { count: "exact", head: true }).is("deleted_at", null),
    db.from("tags").select("*", { count: "exact", head: true }).is("deleted_at", null),
    db.from("restaurant_user").select("*", { count: "exact", head: true }),
    db.from("restaurant_tag").select("*", { count: "exact", head: true }),
    db.from("testmaker_list").select("*", { count: "exact", head: true }),
  ]);
  return {
    totalUsers: users.count ?? 0,
    totalRestaurants: restaurants.count ?? 0,
    totalTags: tags.count ?? 0,
    totalSaves: saves.count ?? 0,
    totalTagApps: tagApps.count ?? 0,
    totalLists: lists.count ?? 0,
  };
}

async function getTopTags() {
  const db = createAdminClient();
  const { data } = await db
    .from("restaurant_tag")
    .select("tag_id, tags(name)")
    .limit(500);
  if (!data) return [];
  const counts: Record<number, { name: string; count: number }> = {};
  for (const row of data) {
    const tag = (row.tags as unknown) as { name: string } | null;
    if (!tag) continue;
    counts[row.tag_id] = counts[row.tag_id]
      ? { ...counts[row.tag_id], count: counts[row.tag_id].count + 1 }
      : { name: tag.name, count: 1 };
  }
  return Object.entries(counts)
    .map(([id, v]) => ({ id: Number(id), ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

async function getTrends(now: Date) {
  const db = createAdminClient();
  const cutoff = new Date(now.getTime() - TREND_WEEKS * 7 * 86400000).toISOString();
  // Row cap: Supabase returns ≤1000 rows/request — fine at current volume (see metrics.md)
  const [users, restaurants, tags, saves] = await Promise.all([
    db.from("users").select("created_at").gte("created_at", cutoff).is("deleted_at", null),
    db.from("restaurants").select("created_at").gte("created_at", cutoff),
    db.from("restaurant_tag").select("created_at").gte("created_at", cutoff),
    db.from("restaurant_user").select("created_at").gte("created_at", cutoff),
  ]);
  const dates = (rows: { data: { created_at: string | null }[] | null }) =>
    (rows.data ?? []).map((r) => r.created_at ?? "");
  return {
    users: bucketByWeek(dates(users), TREND_WEEKS, now),
    restaurants: bucketByWeek(dates(restaurants), TREND_WEEKS, now),
    tags: bucketByWeek(dates(tags), TREND_WEEKS, now),
    saves: bucketByWeek(dates(saves), TREND_WEEKS, now),
  };
}

async function getCityStats(now: Date) {
  const db = createAdminClient();
  const cutoff = new Date(now.getTime() - 60 * 86400000).toISOString();
  const [restaurants, tagEvents, saveEvents] = await Promise.all([
    db.from("restaurants").select("id, city, created_at"),
    db.from("restaurant_tag").select("restaurant_id, created_at").gte("created_at", cutoff),
    db.from("restaurant_user").select("restaurant_id, created_at").gte("created_at", cutoff),
  ]);
  const cityById = new Map<number, string | null>(
    (restaurants.data ?? []).map((r) => [r.id as number, r.city as string | null]),
  );
  const events: CityEvent[] = [
    ...(restaurants.data ?? [])
      .filter((r) => r.created_at && r.created_at >= cutoff)
      .map((r) => ({ city: r.city as string | null, createdAt: r.created_at as string })),
    ...(tagEvents.data ?? []).map((e) => ({
      city: cityById.get(e.restaurant_id as number) ?? null,
      createdAt: e.created_at as string,
    })),
    ...(saveEvents.data ?? []).map((e) => ({
      city: cityById.get(e.restaurant_id as number) ?? null,
      createdAt: e.created_at as string,
    })),
  ];
  return cityLeaderboard(events, now);
}

async function getActivityFeed() {
  const db = createAdminClient();
  const [users, tagEvents, lists] = await Promise.all([
    db.from("users").select("first_name, last_name, email, created_at")
      .is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
    db.from("restaurant_tag").select("created_at, tag_id")
      .order("created_at", { ascending: false }).limit(10),
    db.from("testmaker_list").select("list_name, created_at")
      .order("created_at", { ascending: false }).limit(10),
  ]);
  const tagIds = [...new Set((tagEvents.data ?? []).map((e) => e.tag_id as number))];
  const tagNames = tagIds.length
    ? await db.from("tags").select("id, name").in("id", tagIds)
    : { data: [] as { id: number; name: string }[] };
  const nameById = new Map((tagNames.data ?? []).map((t) => [t.id as number, t.name as string]));
  const items: FeedItem[] = [
    ...(users.data ?? []).map((u) => ({
      type: "signup" as const,
      label: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || (u.email as string),
      createdAt: u.created_at as string,
    })),
    ...(tagEvents.data ?? []).map((e) => ({
      type: "tag" as const,
      label: nameById.get(e.tag_id as number) ?? `tag #${e.tag_id}`,
      createdAt: e.created_at as string,
    })),
    ...(lists.data ?? []).map((l) => ({
      type: "list" as const,
      label: l.list_name as string,
      createdAt: l.created_at as string,
    })),
  ];
  return mergeFeed(items, 10);
}

const PLATFORMS = [
  { id: "ios", label: "ios", status: "live · App Store", color: "var(--tm-accent)" },
  { id: "android", label: "android", status: "in development", color: "var(--tm-warn)" },
  { id: "web", label: "web", status: "live · Railway", color: "var(--tm-accent)" },
  { id: "api", label: "api", status: "live · Railway", color: "var(--tm-accent)" },
];

function fmt(n: number) {
  return n.toLocaleString();
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

function Spark({ values, color = "var(--tm-accent)" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 24 }}>
      {values.map((v, i) => (
        <span
          key={i}
          title={String(v)}
          style={{
            width: 6,
            height: Math.max(2, Math.round((v / max) * 24)),
            background:
              i === values.length - 1 ? color : `color-mix(in srgb, ${color} 55%, transparent)`,
            borderRadius: 1,
          }}
        />
      ))}
    </span>
  );
}

export default async function AdminOverview() {
  const now = new Date();
  const posthogKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const [kpisR, trendsR, citiesR, feedR, topTagsR, webStatsR] = await Promise.allSettled([
    getKpis(),
    getTrends(now),
    getCityStats(now),
    getActivityFeed(),
    getTopTags(),
    posthogKey ? fetchWebStats(posthogKey) : Promise.resolve(null),
  ]);
  const val = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;

  const kpis = val(kpisR);
  const trends = val(trendsR);
  const cities = val(citiesR);
  const feed = val(feedR);
  const topTags = val(topTagsR);
  const webStats = val(webStatsR);

  const KPI_ROWS = kpis
    ? [
        { label: "total_users", value: fmt(kpis.totalUsers) },
        { label: "total_restaurants", value: fmt(kpis.totalRestaurants) },
        { label: "total_tags", value: fmt(kpis.totalTags) },
        { label: "total_saves", value: fmt(kpis.totalSaves) },
        { label: "total_tag_applications", value: fmt(kpis.totalTagApps) },
        { label: "total_lists", value: fmt(kpis.totalLists) },
      ]
    : null;

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
          { label: "overview.tsx", active: true, href: "/admin" },
          { label: "errors.log", active: false, href: "/admin/errors" },
          { label: "roadmap.md", active: false, href: "/admin/roadmap" },
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
              flexShrink: 0,
              display: "block",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div
        style={{
          padding: "14px 18px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        <div style={{ color: "var(--tm-muted)", marginBottom: 16, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm status --all
        </div>

        {/* 1. KPIs */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
            # kpis · live
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {KPI_ROWS ? (
              KPI_ROWS.map((k, i) => (
                <TRow key={k.label} last={i === KPI_ROWS.length - 1}>
                  <span style={{ display: "inline-block", width: 200, color: "var(--tm-muted)" }}>
                    {k.label}
                  </span>
                  <span style={{ color: "var(--tm-ink)", fontWeight: 600 }}>{k.value}</span>
                </TRow>
              ))
            ) : (
              <TRow last>
                <span style={{ color: "var(--tm-err)" }}>query failed — see Railway logs</span>
              </TRow>
            )}
          </div>
        </div>

        {/* 2. Platforms */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
            # platforms
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {PLATFORMS.map((p, i) => (
              <TRow key={p.id} last={i === PLATFORMS.length - 1}>
                <span style={{ display: "inline-block", width: 200, color: "var(--tm-muted)" }}>
                  {p.label}
                </span>
                <span style={{ color: p.color }}>{p.status}</span>
                <Link
                  href={`/admin/platforms/${p.id}`}
                  style={{
                    fontSize: 10.5,
                    color: "var(--tm-accent)",
                    textDecoration: "none",
                    marginLeft: 14,
                  }}
                >
                  → details
                </Link>
              </TRow>
            ))}
          </div>
        </div>

        {/* 3. Trends */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
            # trends · 12w
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {trends ? (
              [
                { label: "new_users", values: trends.users },
                { label: "new_restaurants", values: trends.restaurants },
                { label: "tag_applications", values: trends.tags },
                { label: "saves", values: trends.saves },
              ].map((row, i, arr) => (
                <TRow key={row.label} last={i === arr.length - 1}>
                  <span
                    style={{ display: "inline-block", width: 200, color: "var(--tm-muted)" }}
                  >
                    {row.label}
                  </span>
                  <Spark values={row.values} />
                  <span style={{ fontWeight: 600, marginLeft: 10 }}>
                    {row.values[row.values.length - 1]}
                  </span>
                </TRow>
              ))
            ) : (
              <TRow last>
                <span style={{ color: "var(--tm-err)" }}>query failed — see Railway logs</span>
              </TRow>
            )}
          </div>
        </div>

        {/* 4. Trending cities */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
            # trending cities · 30d
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {!cities ? (
              <TRow last>
                <span style={{ color: "var(--tm-err)" }}>query failed — see Railway logs</span>
              </TRow>
            ) : cities.length === 0 ? (
              <TRow last>
                <span style={{ color: "var(--tm-muted)" }}>no city activity in window</span>
              </TRow>
            ) : (
              cities.map((c, i) => (
                <TRow key={c.city} last={i === cities.length - 1}>
                  <span style={{ display: "inline-block", width: 30, color: "var(--tm-muted)" }}>
                    {i + 1}.
                  </span>
                  <span style={{ display: "inline-block", width: 200 }}>{c.city}</span>
                  <span style={{ color: "var(--tm-muted)" }}>×{c.current}</span>
                  <span
                    style={{
                      marginLeft: 10,
                      color:
                        c.delta > 0
                          ? "var(--tm-accent)"
                          : c.delta < 0
                            ? "var(--tm-err)"
                            : "var(--tm-muted)",
                    }}
                  >
                    {c.delta > 0 ? `▲ ${c.delta}` : c.delta < 0 ? `▼ ${Math.abs(c.delta)}` : "→ 0"}
                  </span>
                </TRow>
              ))
            )}
          </div>
        </div>

        {/* 5. Web / PostHog */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
            # web · posthog 7d
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {!posthogKey ? (
              <TRow last>
                <span style={{ color: "var(--tm-warn)" }}>
                  ○ needs POSTHOG_PERSONAL_API_KEY
                </span>
              </TRow>
            ) : webStatsR.status === "rejected" || webStats === null ? (
              <TRow last>
                <span style={{ color: "var(--tm-err)" }}>query failed — see Railway logs</span>
              </TRow>
            ) : (
              <TRow last>
                <span style={{ display: "inline-block", width: 200, color: "var(--tm-muted)" }}>
                  views
                </span>
                <span style={{ fontWeight: 600 }}>
                  {fmt(webStats.reduce((s, d) => s + d.views, 0))}
                </span>
                <span style={{ color: "var(--tm-muted)", marginLeft: 14 }}>
                  visitors {fmt(webStats.reduce((s, d) => s + d.visitors, 0))}
                </span>
                <span style={{ marginLeft: 14 }}>
                  <Spark values={webStats.map((d) => d.views)} />
                </span>
              </TRow>
            )}
          </div>
        </div>

        {/* 6. Two-column: activity | top tags */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {/* Activity feed */}
          <div>
            <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
              # activity
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {!feed ? (
                <TRow last>
                  <span style={{ color: "var(--tm-err)" }}>query failed — see Railway logs</span>
                </TRow>
              ) : feed.length === 0 ? (
                <TRow last>
                  <span style={{ color: "var(--tm-muted)" }}>no recent activity</span>
                </TRow>
              ) : (
                feed.map((item, i) => (
                  <TRow key={`${item.type}-${item.createdAt}-${i}`} last={i === feed.length - 1}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 20,
                        color: "var(--tm-accent)",
                      }}
                    >
                      {item.type === "signup" ? "+" : item.type === "tag" ? "#" : "≡"}
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span
                      style={{
                        color: "var(--tm-muted)",
                        fontSize: 10.5,
                        marginLeft: 10,
                      }}
                    >
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </TRow>
                ))
              )}
            </div>
          </div>

          {/* Top tags */}
          <div>
            <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
              # top tags · by usage
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {!topTags ? (
                <TRow last>
                  <span style={{ color: "var(--tm-err)" }}>query failed — see Railway logs</span>
                </TRow>
              ) : topTags.length === 0 ? (
                <TRow last>
                  <span style={{ color: "var(--tm-muted)" }}>no tags found</span>
                </TRow>
              ) : (
                topTags.map((t, i) => (
                  <TRow key={t.id} last={i === topTags.length - 1}>
                    <span style={{ display: "inline-block", width: 160 }}>{t.name}</span>
                    <span style={{ color: "var(--tm-muted)" }}>×{t.count}</span>
                  </TRow>
                ))
              )}
            </div>
            <div style={{ marginTop: 6 }}>
              <Link
                href="/admin/tags"
                style={{ fontSize: 10.5, color: "var(--tm-accent)", textDecoration: "none" }}
              >
                → view all tags
              </Link>
            </div>
          </div>
        </div>

        <div style={{ color: "var(--tm-muted)", fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span>{" "}
          <span
            className="tm-cursor"
            style={{
              display: "inline-block",
              width: 7,
              height: 13,
              background: "var(--tm-accent)",
              verticalAlign: "text-bottom",
            }}
          />
        </div>
      </div>
    </div>
  );
}
