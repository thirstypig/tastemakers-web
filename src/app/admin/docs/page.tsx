import Link from "next/link";
import { DOCS_REGISTRY, DOC_CATEGORIES, fetchDocUpdated, type DocEntry } from "@/lib/docs";

function sourceLabel(d: DocEntry): { repo: string; badge: string; badgeColor: string } {
  if (d.source.type === "github")
    return { repo: d.source.repo.replace("thirstypig/", ""), badge: "live·github", badgeColor: "var(--tm-accent)" };
  return { repo: "tastemakers-web", badge: "local", badgeColor: "var(--tm-muted)" };
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
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}

export default async function DocsPage() {
  const updated = await Promise.all(
    DOCS_REGISTRY.map((d) => fetchDocUpdated(d.source).catch(() => null)),
  );
  const updatedById = new Map(DOCS_REGISTRY.map((d, i) => [d.id, updated[i]]));

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
          { label: "docs/", active: true, href: "/admin/docs" },
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
          <span style={{ color: "var(--tm-accent)" }}>$</span> ls docs/ --group-by category
        </div>

        {DOC_CATEGORIES.map((cat) => {
          const docs = DOCS_REGISTRY.filter((d) => d.category === cat.id);
          if (docs.length === 0) return null;
          return (
            <div key={cat.id} style={{ marginBottom: 18 }}>
              <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
                # {cat.label} · {docs.length}
              </div>
              <div
                style={{
                  background: "var(--tm-panel)",
                  border: "1px solid var(--tm-line)",
                  borderRadius: 6,
                }}
              >
                {docs.map((doc, i) => {
                  const { repo, badge, badgeColor } = sourceLabel(doc);
                  const date = updatedById.get(doc.id) ?? "—";
                  return (
                    <Link
                      key={doc.id}
                      href={`/admin/docs/${doc.id}`}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <TRow last={i === docs.length - 1}>
                        <span style={{ flex: 1, color: "var(--tm-accent)" }}>
                          → {doc.title}
                        </span>
                        <span style={{ width: 180, color: "var(--tm-muted)" }}>
                          {repo}
                        </span>
                        <span style={{ width: 100, color: badgeColor }}>
                          {badge}
                        </span>
                        <span style={{ width: 90, color: "var(--tm-muted)" }}>
                          {date}
                        </span>
                      </TRow>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
