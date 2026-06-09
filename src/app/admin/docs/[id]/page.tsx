import { marked } from "marked";
import { notFound } from "next/navigation";
import { fetchMarkdown, type DocSource } from "@/lib/docs";

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

type DocMeta = {
  id: string;
  title: string;
  source: DocSource;
};

const DOCS: DocMeta[] = [
  {
    id: "blockers",
    title: "Blockers & Next Steps",
    source: { type: "local", file: "src/content/docs/blockers.md" },
  },
  {
    id: "going-live",
    title: "Going Live Roadmap",
    source: { type: "local", file: "src/content/docs/going-live.md" },
  },
  {
    id: "backend-claude",
    title: "Backend — CLAUDE.md",
    source: {
      type: "github",
      repo: "thirstypig/tastemakers-backend",
      branch: "main",
      file: "CLAUDE.md",
    },
  },
  {
    id: "web-claude",
    title: "Web App — CLAUDE.md",
    source: {
      type: "github",
      repo: "thirstypig/tastemakers-web",
      branch: "main",
      file: "CLAUDE.md",
    },
  },
  {
    id: "backend-todos",
    title: "Backend Todos — 31 items",
    source: {
      type: "github",
      repo: "thirstypig/tastemakers-backend",
      branch: "main",
      file: "todos/README.md",
    },
  },
  {
    id: "cross-todos",
    title: "Cross-Project Todos — 49 items",
    source: { type: "local", file: "src/content/docs/cross-todos.md" },
  },
];

// Override renderer for dark theme styling
const renderer = new marked.Renderer();

renderer.heading = ({ text, depth }) => {
  const sizes: Record<number, string> = { 1: "24px", 2: "18px", 3: "15px", 4: "13px" };
  const margins: Record<number, string> = { 1: "0 0 20px", 2: "32px 0 12px", 3: "24px 0 10px", 4: "20px 0 8px" };
  const colors: Record<number, string> = { 1: t.text, 2: t.text, 3: t.muted, 4: t.dim };
  return `<h${depth} style="font-size:${sizes[depth] ?? "13px"};margin:${margins[depth] ?? "16px 0 8px"};color:${colors[depth] ?? t.dim};font-weight:600;line-height:1.3">${text}</h${depth}>`;
};

renderer.paragraph = ({ text }) =>
  `<p style="margin:0 0 14px;color:${t.muted};font-size:13px;line-height:1.7">${text}</p>`;

renderer.strong = ({ text }) =>
  `<strong style="color:${t.text};font-weight:600">${text}</strong>`;

renderer.em = ({ text }) =>
  `<em style="color:${t.dim}">${text}</em>`;

renderer.code = ({ text, lang }) =>
  `<pre style="background:${t.bg};border:1px solid ${t.border};border-radius:6px;padding:14px 16px;overflow-x:auto;margin:0 0 16px"><code style="font-family:${t.mono};font-size:11px;color:${t.muted};white-space:pre">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;

renderer.codespan = ({ text }) =>
  `<code style="font-family:${t.mono};font-size:11px;background:${t.border}80;color:${t.accent};padding:2px 5px;border-radius:3px">${text}</code>`;


renderer.hr = () =>
  `<hr style="border:none;border-top:1px solid ${t.border};margin:24px 0" />`;

renderer.link = ({ href, text }) =>
  `<a href="${href}" style="color:${t.accent};text-decoration:none" target="_blank" rel="noopener">${text}</a>`;

renderer.table = ({ header, rows }) =>
  `<div style="overflow-x:auto;margin:0 0 16px"><table style="width:100%;border-collapse:collapse;font-size:12px">${header}${rows}</table></div>`;

renderer.tablerow = ({ text }) =>
  `<tr style="border-bottom:1px solid ${t.border}">${text}</tr>`;

renderer.tablecell = ({ text, header }) => {
  const tag = header ? "th" : "td";
  return `<${tag} style="padding:8px 12px;text-align:left;color:${header ? t.text : t.muted};font-weight:${header ? 600 : 400};background:${header ? t.surface : "transparent"}">${text}</${tag}>`;
};

renderer.blockquote = ({ text }) =>
  `<blockquote style="border-left:3px solid ${t.accent}60;margin:0 0 16px;padding:8px 16px;color:${t.dim};font-style:italic">${text}</blockquote>`;

marked.use({ renderer });

export default async function DocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = DOCS.find((d) => d.id === id);
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
        {DOCS.map((d) => (
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
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxWidth: 840 }}>
        {markdown ? (
          <>
            <style>{`
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
              dangerouslySetInnerHTML={{ __html: marked.parse(markdown) as string }}
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
  return DOCS.map((d) => ({ id: d.id }));
}
