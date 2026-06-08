import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";

async function getTagsWithCounts() {
  const db = createAdminClient();
  const [tagsResult, usageResult] = await Promise.all([
    db
      .from("tags")
      .select("id, name, created_at")
      .is("deleted_at", null)
      .order("name"),
    db.from("restaurant_tag").select("tag_id").limit(10000),
  ]);

  const tags = tagsResult.data ?? [];
  const usage: Record<number, number> = {};
  for (const row of usageResult.data ?? []) {
    usage[row.tag_id] = (usage[row.tag_id] ?? 0) + 1;
  }

  return tags
    .map((t) => ({ ...t, uses: usage[t.id] ?? 0 }))
    .sort((a, b) => b.uses - a.uses);
}

type Tag = {
  id: number;
  name: string;
  created_at: string | null;
  uses: number;
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

export default async function TagsPage() {
  const tags = await getTagsWithCounts();
  const totalUses = tags.reduce((s, t) => s + t.uses, 0);

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
          { label: "tags.tsx", active: true, href: "/admin/tags" },
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
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm tags --sort usage
        </div>

        <div style={{ color: "var(--tm-muted)", marginBottom: 10, fontSize: 12 }}>
          # tags · {tags.length} total · {totalUses.toLocaleString()} applications · sorted by usage
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
              <span style={{ width: 80 }}>USES</span>
              <span style={{ width: 160 }}>BAR</span>
              <span style={{ width: 90 }}>ADDED</span>
            </span>
          </TRow>

          {tags.length === 0 ? (
            <TRow last>
              <span style={{ color: "var(--tm-muted)" }}>no tags found</span>
            </TRow>
          ) : (
            tags.map((t: Tag, i: number) => {
              const maxUses = tags[0]?.uses ?? 1;
              const barWidth = maxUses > 0 ? Math.round((t.uses / maxUses) * 100) : 0;
              return (
                <TRow key={t.id} last={i === tags.length - 1}>
                  <span style={{ width: 56, color: "var(--tm-muted)" }}>{t.id}</span>
                  <span style={{ flex: 1 }}>{t.name}</span>
                  <span
                    style={{
                      width: 80,
                      color: t.uses > 0 ? "var(--tm-ink)" : "var(--tm-muted)",
                      fontWeight: t.uses > 0 ? 600 : 400,
                    }}
                  >
                    {t.uses}
                  </span>
                  <span style={{ width: 160, paddingRight: 12 }}>
                    <span
                      style={{
                        display: "inline-block",
                        height: 6,
                        width: `${barWidth}%`,
                        background: "var(--tm-accent)",
                        borderRadius: 2,
                        opacity: 0.7,
                        minWidth: t.uses > 0 ? 2 : 0,
                      }}
                    />
                  </span>
                  <span style={{ width: 90, color: "var(--tm-muted)" }}>
                    {t.created_at
                      ? new Date(t.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        })
                      : "—"}
                  </span>
                </TRow>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
