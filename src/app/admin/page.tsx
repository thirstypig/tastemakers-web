import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";

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

async function getRecentUsers() {
  const db = createAdminClient();
  const { data } = await db
    .from("users")
    .select("id, email, first_name, last_name, user_type, is_testmaker, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
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

export default async function AdminOverview() {
  const [kpis, recentUsers, topTags] = await Promise.all([
    getKpis(),
    getRecentUsers(),
    getTopTags(),
  ]);

  const KPI_ROWS = [
    { label: "total_users", value: fmt(kpis.totalUsers) },
    { label: "total_restaurants", value: fmt(kpis.totalRestaurants) },
    { label: "total_tags", value: fmt(kpis.totalTags) },
    { label: "total_saves", value: fmt(kpis.totalSaves) },
    { label: "total_tag_applications", value: fmt(kpis.totalTagApps) },
    { label: "total_lists", value: fmt(kpis.totalLists) },
  ];

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

        {/* KPIs */}
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
            {KPI_ROWS.map((k, i) => (
              <TRow key={k.label} last={i === KPI_ROWS.length - 1}>
                <span style={{ display: "inline-block", width: 200, color: "var(--tm-muted)" }}>
                  {k.label}
                </span>
                <span style={{ color: "var(--tm-ink)", fontWeight: 600 }}>{k.value}</span>
              </TRow>
            ))}
          </div>
        </div>

        {/* Two-column: recent users | top tags */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {/* Recent signups */}
          <div>
            <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
              # recent signups
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {recentUsers.length === 0 ? (
                <TRow last>
                  <span style={{ color: "var(--tm-muted)" }}>no users found</span>
                </TRow>
              ) : (
                recentUsers.map((u, i) => (
                  <TRow key={u.id} last={i === recentUsers.length - 1}>
                    <div>
                      <span style={{ fontWeight: 600 }}>
                        {u.first_name ?? ""} {u.last_name ?? ""}
                      </span>
                      {u.is_testmaker ? (
                        <span style={{ color: "var(--tm-accent)", marginLeft: 6 }}>★</span>
                      ) : null}
                    </div>
                    <div style={{ color: "var(--tm-muted)", fontSize: 10.5, marginTop: 2 }}>
                      {u.email}
                    </div>
                    <div style={{ color: "var(--tm-muted)", fontSize: 10.5 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </div>
                  </TRow>
                ))
              )}
            </div>
            <div style={{ marginTop: 6 }}>
              <Link
                href="/admin/users"
                style={{ fontSize: 10.5, color: "var(--tm-accent)", textDecoration: "none" }}
              >
                → view all users
              </Link>
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
              {topTags.length === 0 ? (
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
