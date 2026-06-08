import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";

async function getRestaurants() {
  const db = createAdminClient();
  const { data } = await db
    .from("restaurants")
    .select("id, place_id, name, address, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

async function getSaveCounts(): Promise<Record<number, number>> {
  const db = createAdminClient();
  const { data } = await db
    .from("restaurant_user")
    .select("restaurant_id")
    .limit(5000);
  if (!data) return {};
  const counts: Record<number, number> = {};
  for (const row of data) {
    counts[row.restaurant_id] = (counts[row.restaurant_id] ?? 0) + 1;
  }
  return counts;
}

async function getTagCounts(): Promise<Record<number, number>> {
  const db = createAdminClient();
  const { data } = await db
    .from("restaurant_tag")
    .select("restaurant_id")
    .limit(5000);
  if (!data) return {};
  const counts: Record<number, number> = {};
  for (const row of data) {
    counts[row.restaurant_id] = (counts[row.restaurant_id] ?? 0) + 1;
  }
  return counts;
}

type Restaurant = {
  id: number;
  place_id: string;
  name: string | null;
  address: string | null;
  created_at: string | null;
};

function TRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        padding: "7px 14px",
        borderBottom: last ? "none" : "1px solid var(--tm-line)",
        fontSize: 11.5,
        color: "var(--tm-ink)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}

export default async function RestaurantsPage() {
  const [restaurants, saveCounts, tagCounts] = await Promise.all([
    getRestaurants(),
    getSaveCounts(),
    getTagCounts(),
  ]);

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
          { label: "restaurants.tsx", active: true, href: "/admin/restaurants" },
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
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm restaurants --limit 100
        </div>

        <div style={{ color: "var(--tm-muted)", marginBottom: 10, fontSize: 12 }}>
          # restaurants · {restaurants.length} shown · sorted by added date
        </div>

        <div
          style={{
            background: "var(--tm-panel)",
            border: "1px solid var(--tm-line)",
            borderRadius: 6,
          }}
        >
          <TRow>
            <span style={{ color: "var(--tm-muted)", display: "flex", width: "100%" }}>
              <span style={{ width: 56 }}>ID</span>
              <span style={{ flex: 1 }}>NAME</span>
              <span style={{ flex: 1 }}>ADDRESS</span>
              <span style={{ width: 64 }}>SAVES</span>
              <span style={{ width: 64 }}>TAGS</span>
              <span style={{ width: 90 }}>ADDED</span>
            </span>
          </TRow>

          {restaurants.length === 0 ? (
            <TRow last>
              <span style={{ color: "var(--tm-muted)" }}>no restaurants found</span>
            </TRow>
          ) : (
            restaurants.map((r: Restaurant, i: number) => (
              <TRow key={r.id} last={i === restaurants.length - 1}>
                <span style={{ width: 56, color: "var(--tm-muted)" }}>{r.id}</span>
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    paddingRight: 8,
                  }}
                >
                  {r.name ?? r.place_id}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "var(--tm-muted)",
                    paddingRight: 8,
                  }}
                >
                  {r.address ?? "—"}
                </span>
                <span style={{ width: 64, color: saveCounts[r.id] ? "var(--tm-ink)" : "var(--tm-muted)" }}>
                  {saveCounts[r.id] ?? 0}
                </span>
                <span style={{ width: 64, color: tagCounts[r.id] ? "var(--tm-ink)" : "var(--tm-muted)" }}>
                  {tagCounts[r.id] ?? 0}
                </span>
                <span style={{ width: 90, color: "var(--tm-muted)" }}>
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })
                    : "—"}
                </span>
              </TRow>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
