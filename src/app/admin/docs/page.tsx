import Link from "next/link";
import { getDocsRegistry, groupBySection, statusBadge, fetchDocUpdated } from "@/lib/docs";
import DocsBrowser, { type BrowserGroup } from "./DocsBrowser";

export default async function DocsPage() {
  const registry = getDocsRegistry();

  const updated = await Promise.all(registry.map((d) => fetchDocUpdated(d.source).catch(() => null)));
  const updatedById = new Map(registry.map((d, i) => [d.id, updated[i]]));

  const groups: BrowserGroup[] = groupBySection(registry).map((g) => ({
    section: g.section,
    label: g.label,
    blurb: g.blurb,
    docs: g.docs.map((d) => ({
      id: d.id,
      title: d.title,
      section: d.section,
      docType: d.docType,
      tags: d.tags,
      path: d.path,
      remote: d.source.type === "github" ? d.source.repo.replace("thirstypig/", "") : undefined,
      generated: d.generated,
      updated: updatedById.get(d.id) ?? null,
      badge: statusBadge(d),
    })),
  }));

  return (
    <div>
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

      <DocsBrowser groups={groups} />
    </div>
  );
}
