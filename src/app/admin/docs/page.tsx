import Link from "next/link";

const DOCS = [
  { id: "backend-claude", name: "CLAUDE.md", repo: "tastemakers-backend", size: "11.0 KB", updated: "2d" },
  { id: "web-claude", name: "CLAUDE.md", repo: "tastemakers-web", size: "8.2 KB", updated: "4d" },
  { id: "ios-claude", name: "CLAUDE.md", repo: "tastemakers-ios", size: "5.1 KB", updated: "1w" },
  { id: "android-claude", name: "CLAUDE.md", repo: "tastemakers-android", size: "5.6 KB", updated: "1w" },
  { id: "root-claude", name: "CLAUDE.md", repo: "tastemakers (root)", size: "9.4 KB", updated: "2d" },
  { id: "backend-readme", name: "README.md", repo: "tastemakers-backend", size: "3.8 KB", updated: "2w" },
  { id: "master-ports", name: "MASTER-PORTS.md", repo: "all", size: "7.7 KB", updated: "2d" },
  { id: "cross-todos", name: "todos/README.md", repo: "tastemakers (root)", size: "12.1 KB", updated: "today" },
  { id: "backend-todos", name: "todos/README.md", repo: "tastemakers-backend", size: "8.4 KB", updated: "2w" },
];

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

export default function DocsPage() {
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
          <span style={{ color: "var(--tm-accent)" }}>$</span> ls docs/ --all
        </div>

        <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
          # docs · {DOCS.length} files
        </div>

        <div
          style={{
            background: "var(--tm-panel)",
            border: "1px solid var(--tm-line)",
            borderRadius: 6,
          }}
        >
          {/* Header */}
          <TRow>
            <span style={{ flex: 1, color: "var(--tm-muted)" }}>FILE</span>
            <span style={{ width: 200, color: "var(--tm-muted)" }}>REPO</span>
            <span style={{ width: 72, color: "var(--tm-muted)" }}>SIZE</span>
            <span style={{ width: 72, color: "var(--tm-muted)" }}>UPDATED</span>
          </TRow>
          {DOCS.map((doc, i) => (
            <Link
              key={doc.id}
              href={`/admin/docs/${doc.id}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <TRow last={i === DOCS.length - 1}>
                <span style={{ flex: 1, color: "var(--tm-accent)" }}>
                  → {doc.name}
                </span>
                <span style={{ width: 200, color: "var(--tm-muted)" }}>
                  {doc.repo}
                </span>
                <span style={{ width: 72, color: "var(--tm-muted)" }}>
                  {doc.size}
                </span>
                <span style={{ width: 72, color: "var(--tm-muted)" }}>
                  {doc.updated}
                </span>
              </TRow>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
