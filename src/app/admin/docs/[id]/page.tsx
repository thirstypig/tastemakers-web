import { notFound } from "next/navigation";
import { fetchMarkdown, DOCS_REGISTRY, DOC_CATEGORIES, getDoc } from "@/lib/docs";
import { renderMarkdown } from "@/lib/markdown";

const t = {
  bg: "var(--tm-bg)",
  surface: "var(--tm-panel)",
  border: "var(--tm-line)",
  text: "var(--tm-ink)",
  muted: "var(--tm-muted)",
  dim: "var(--tm-muted)",
  accent: "var(--tm-accent)",
  green: "var(--tm-accent)",
  red: "var(--tm-err)",
  font: "var(--font-jetbrains-mono), monospace",
  mono: "var(--font-jetbrains-mono), monospace",
};

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = getDoc(id);
  if (!doc) notFound();

  const markdown = await fetchMarkdown(doc.source);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: t.font }}>
      {/* Doc list sidebar */}
      <aside
        style={{
          width: 200,
          borderRight: `1px solid ${t.border}`,
          padding: "20px 0",
          flexShrink: 0,
        }}
      >
        <a
          href="/admin/docs"
          style={{
            display: "block",
            padding: "6px 16px 14px",
            fontSize: 11,
            color: t.dim,
            textDecoration: "none",
          }}
        >
          ← All docs
        </a>
        {DOC_CATEGORIES.map((cat) => {
          const docs = DOCS_REGISTRY.filter((d) => d.category === cat.id);
          if (docs.length === 0) return null;
          return (
            <div key={cat.id}>
              <div style={{ padding: "10px 16px 4px", fontSize: 10, color: t.dim, textTransform: "uppercase", letterSpacing: 1 }}>
                {cat.label}
              </div>
              {docs.map((d) => (
                <a
                  key={d.id}
                  href={`/admin/docs/${d.id}`}
                  style={{
                    display: "block",
                    padding: "8px 16px",
                    fontSize: 12,
                    color: d.id === id ? t.text : t.muted,
                    textDecoration: "none",
                    background: d.id === id ? `${t.accent}12` : "transparent",
                    borderLeft: d.id === id ? `2px solid ${t.accent}` : "2px solid transparent",
                  }}
                >
                  {d.title}
                </a>
              ))}
            </div>
          );
        })}
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxWidth: 840 }}>
        {markdown ? (
          <>
            <style>{`
              .md-body h1, .md-body h2 { color: ${t.text}; font-weight: 600; line-height: 1.3; }
              .md-body h3 { color: ${t.muted}; font-weight: 600; line-height: 1.3; }
              .md-body h4, .md-body h5, .md-body h6 { color: ${t.dim}; font-weight: 600; line-height: 1.3; }
              .md-body h1 { font-size: 24px; margin: 0 0 20px; }
              .md-body h2 { font-size: 18px; margin: 32px 0 12px; }
              .md-body h3 { font-size: 15px; margin: 24px 0 10px; }
              .md-body h4 { font-size: 13px; margin: 20px 0 8px; }
              .md-body p { margin: 0 0 14px; color: ${t.muted}; font-size: 13px; line-height: 1.7; }
              .md-body strong { color: ${t.text}; font-weight: 600; }
              .md-body em { color: ${t.dim}; }
              .md-body pre {
                background: ${t.bg}; border: 1px solid ${t.border}; border-radius: 6px;
                padding: 14px 16px; overflow-x: auto; margin: 0 0 16px;
              }
              .md-body pre code {
                font-family: ${t.mono}; font-size: 11px; color: ${t.muted};
                white-space: pre; background: transparent; padding: 0;
              }
              .md-body :not(pre) > code {
                font-family: ${t.mono}; font-size: 11px; background: ${t.border}80;
                color: ${t.accent}; padding: 2px 5px; border-radius: 3px;
              }
              .md-body hr { border: none; border-top: 1px solid ${t.border}; margin: 24px 0; }
              .md-body a { color: ${t.accent}; text-decoration: none; }
              .md-body table {
                width: 100%; border-collapse: collapse; font-size: 12px;
                display: block; overflow-x: auto; margin: 0 0 16px;
              }
              .md-body tr { border-bottom: 1px solid ${t.border}; }
              .md-body th, .md-body td { padding: 8px 12px; text-align: left; }
              .md-body th { color: ${t.text}; font-weight: 600; background: ${t.surface}; }
              .md-body td { color: ${t.muted}; font-weight: 400; }
              .md-body blockquote {
                border-left: 3px solid ${t.accent}60; margin: 0 0 16px;
                padding: 8px 16px; color: ${t.dim}; font-style: italic;
              }
              .md-body blockquote p { margin: 0; }
              .md-body ul,
              .md-body ol {
                margin: 0 0 16px;
                padding-left: 22px;
                color: ${t.muted};
                font-size: 13px;
                line-height: 1.8;
              }
              .md-body li { margin-bottom: 4px; }
              .md-body input[type="checkbox"] { margin-right: 6px; accent-color: ${t.accent}; }
            `}</style>
            <div
              className="md-body"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
            <p
              style={{
                marginTop: 40,
                fontSize: 11,
                color: t.dim,
                fontFamily: t.mono,
                borderTop: `1px solid ${t.border}`,
                paddingTop: 16,
              }}
            >
              {doc.source.type === "github"
                ? `Source: github.com/${(doc.source as { repo: string }).repo} · cached 5 min`
                : "Source: local file in tastemakers-web repo"}
            </p>
          </>
        ) : (
          <div
            style={{
              padding: "32px",
              background: `${t.red}10`,
              border: `1px solid ${t.red}30`,
              borderRadius: 8,
            }}
          >
            <p style={{ margin: 0, color: t.red, fontSize: 14 }}>
              Could not load document
            </p>
            <p style={{ margin: "8px 0 0", color: t.muted, fontSize: 12 }}>
              {doc.source.type === "github"
                ? `Failed to fetch from github.com/${(doc.source as { repo: string }).repo}`
                : "Local file not found"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export function generateStaticParams() {
  return DOCS_REGISTRY.map((d) => ({ id: d.id }));
}
