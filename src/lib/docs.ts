import fs from "fs";
import path from "path";

export type DocSource =
  | { type: "local"; file: string }
  | { type: "github"; repo: string; branch: string; file: string };

function githubHeaders(): HeadersInit {
  return {
    Accept: "application/vnd.github.v3+json",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : {}),
  };
}

export async function fetchMarkdown(source: DocSource): Promise<string | null> {
  if (source.type === "local") {
    try {
      return fs.readFileSync(path.join(process.cwd(), source.file), "utf-8");
    } catch {
      return null;
    }
  }
  // Contents API (not raw.githubusercontent.com): honors GITHUB_TOKEN auth,
  // which is required for the private repos (backend, ios, android).
  const url = `https://api.github.com/repos/${source.repo}/contents/${encodeURIComponent(source.file)}?ref=${source.branch}`;
  try {
    const res = await fetch(url, {
      headers: { ...githubHeaders(), Accept: "application/vnd.github.raw+json" },
      next: { revalidate: 300 },
    } as RequestInit);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export async function fetchDocUpdated(source: DocSource): Promise<string | null> {
  if (source.type === "local") {
    try {
      return fs.statSync(path.join(process.cwd(), source.file)).mtime.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }
  try {
    const url = `https://api.github.com/repos/${source.repo}/commits?path=${encodeURIComponent(source.file)}&sha=${source.branch}&per_page=1`;
    const res = await fetch(url, { headers: githubHeaders(), next: { revalidate: 300 } } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.[0]?.commit?.committer?.date as string | undefined)?.slice(0, 10) ?? null;
  } catch {
    return null;
  }
}

/* ────────────────────────────── sections ────────────────────────────── */

export type DocSection =
  | "inbox" | "product" | "marketing" | "engineering" | "security"
  | "operations" | "prompts" | "troubleshooting" | "foundations" | "notes";

/** Ordered most-referenced first, foundations and scratch at the bottom. */
export const DOC_SECTIONS: { id: DocSection; label: string; blurb: string }[] = [
  { id: "inbox", label: "inbox", blurb: "Open comments needing a response — read this first." },
  { id: "product", label: "product", blurb: "What we're building and why — PRDs, roadmap, to-dos." },
  { id: "marketing", label: "marketing", blurb: "Market, pricing, acquisition, retention." },
  { id: "engineering", label: "engineering", blurb: "How it's built — decisions, architecture, API, testing." },
  { id: "security", label: "security", blurb: "Posture and open risks, stated honestly." },
  { id: "operations", label: "operations", blurb: "Metrics, costs, status, runbook — is it healthy?" },
  { id: "prompts", label: "prompt library", blurb: "Prompts the product actually runs." },
  { id: "troubleshooting", label: "troubleshooting", blurb: "Solved problems — check here before debugging." },
  { id: "foundations", label: "foundations", blurb: "Glossary, guides, conventions, design system." },
  { id: "notes", label: "notes", blurb: "Scratchpad. Not authoritative." },
];

/** Frontmatter `type` → board section. File by intent, not by folder. */
const TYPE_SECTION: Record<string, DocSection> = {
  inbox: "inbox",
  prd: "product", "launch-spec": "product", "intake-rules": "product",
  roadmap: "product", todos: "product",
  marketing: "marketing",
  adr: "engineering", "tech-spec": "engineering", "api-docs": "engineering",
  "decision-log": "engineering", testing: "engineering", "component-lib": "engineering",
  security: "security",
  stats: "operations", costs: "operations", status: "operations", runbook: "operations",
  changelog: "operations", risk: "operations", experiment: "operations", privacy: "operations",
  prompt: "prompts",
  solution: "troubleshooting",
  glossary: "foundations", guide: "foundations", context: "foundations",
  "design-system": "foundations",
  note: "notes",
};

/** Small path→section escape hatch for docs whose `type` doesn't place them well. */
const SECTION_OVERRIDES: { prefix: string; section: DocSection }[] = [
  { prefix: "docs/solutions/", section: "troubleshooting" },
  { prefix: "docs/superpowers/", section: "notes" },
];

/* ────────────────────────── pure helpers (tested) ────────────────────────── */

export type DocFrontmatter = {
  id?: string; type?: string; status?: string; title?: string;
  tags?: string[]; links?: string[]; updated?: string;
  shipped?: boolean; priority?: string;
};

/**
 * Remove fenced code blocks. Without this a `# comment` inside a bash block
 * becomes the document title — the single most common title-extraction bug.
 */
export function stripCodeFences(raw: string): string {
  return raw.replace(/```[\s\S]*?```/g, "");
}

export function stripFrontmatterBlock(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  return end === -1 ? raw : raw.slice(end + 4);
}

/** HTML comments hold writer guidance that can contain `#` lines. */
export function stripHtmlComments(raw: string): string {
  return raw.replace(/<!--[\s\S]*?-->/g, "");
}

export function parseFrontmatter(raw: string): DocFrontmatter {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const out: Record<string, unknown> = {};
  for (const line of raw.slice(4, end).split("\n")) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      out[key] = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      continue;
    }
    val = val.replace(/^["']|["']$/g, "");
    if (val === "true" || val === "false") out[key] = val === "true";
    else if (val === "null" || val === "") out[key] = undefined;
    else out[key] = val;
  }
  return out as DocFrontmatter;
}

/** Last-resort title: "2026-06-09-admin-docs-dashboard.md" → "Admin Docs Dashboard". */
export function tidyFilename(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base
    .replace(/\.md$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Title resolution: first H1 → frontmatter `title` → tidied filename.
 * Code fences, frontmatter, and HTML comments are stripped before matching.
 */
export function extractTitle(raw: string, filePath: string): string {
  const body = stripHtmlComments(stripCodeFences(stripFrontmatterBlock(raw)));
  const h1 = body.match(/^#[ \t]+(.+?)[ \t]*$/m);
  if (h1?.[1]) return h1[1].trim();
  const fm = parseFrontmatter(raw);
  if (fm.title) return fm.title;
  return tidyFilename(filePath);
}

/**
 * Excluded from indexing. `docs/` currently contains no git-ignored files, so
 * this covers the real cases: templates, underscore-prefixed inputs (_comments.json),
 * dotfiles, and anything that isn't markdown.
 */
export function isExcluded(relPath: string): boolean {
  const parts = relPath.split("/");
  if (!relPath.toLowerCase().endsWith(".md")) return true;
  if (parts.some((p) => p === "_templates" || p === "node_modules" || p === ".next")) return true;
  return parts.some((p) => p.startsWith("_") || p.startsWith("."));
}

export function sectionFor(fm: DocFrontmatter, relPath: string): DocSection | null {
  const override = SECTION_OVERRIDES.find((o) => relPath.startsWith(o.prefix));
  if (override && !fm.type) return override.section;
  if (fm.type && TYPE_SECTION[fm.type]) return TYPE_SECTION[fm.type];
  if (override) return override.section;
  return null; // no type → not indexable
}

export function slugFor(fm: DocFrontmatter, relPath: string): string {
  if (fm.id) return fm.id.toLowerCase();
  return relPath.replace(/^docs\//, "").replace(/\.md$/i, "").replace(/\//g, "-").toLowerCase();
}

/* ────────────────────────────── registry ────────────────────────────── */

export type DocEntry = {
  id: string;
  title: string;
  section: DocSection;
  docType?: string;
  status?: string;
  shipped?: boolean;
  tags: string[];
  path: string;
  source: DocSource;
  generated?: boolean;
};

const BACKEND = "thirstypig/tastemakers-backend";

/** Cross-repo docs that can't be walked locally — fetched from GitHub. */
const REMOTE_DOCS: DocEntry[] = [
  { id: "master-ports", title: "MASTER-PORTS.md", section: "foundations", docType: "guide", tags: ["infra"],
    path: "MASTER-PORTS.md", source: { type: "github", repo: BACKEND, branch: "main", file: "MASTER-PORTS.md" } },
  { id: "backend-readme", title: "Backend README", section: "foundations", docType: "guide", tags: ["backend"],
    path: "README.md", source: { type: "github", repo: BACKEND, branch: "main", file: "README.md" } },
  { id: "backend-claude", title: "Backend — CLAUDE.md", section: "foundations", docType: "context", tags: ["backend"],
    path: "CLAUDE.md", source: { type: "github", repo: BACKEND, branch: "main", file: "CLAUDE.md" } },
  { id: "web-claude", title: "Web — CLAUDE.md", section: "foundations", docType: "context", tags: ["web"],
    path: "CLAUDE.md", source: { type: "github", repo: "thirstypig/tastemakers-web", branch: "main", file: "CLAUDE.md" } },
  { id: "ios-claude", title: "iOS — CLAUDE.md", section: "foundations", docType: "context", tags: ["ios"],
    path: "CLAUDE.md", source: { type: "github", repo: "thirstypig/tastemakers-ios", branch: "master", file: "CLAUDE.md" } },
  { id: "android-claude", title: "Android — CLAUDE.md", section: "foundations", docType: "context", tags: ["android"],
    path: "CLAUDE.md", source: { type: "github", repo: "thirstypig/tastemakers-android", branch: "main", file: "CLAUDE.md" } },
  { id: "backend-todos", title: "Backend Todos", section: "product", docType: "todos", tags: ["backend"],
    path: "todos/README.md", source: { type: "github", repo: BACKEND, branch: "main", file: "todos/README.md" } },
];

const GENERATED = new Set(["stats", "costs", "status", "inbox"]);

function walk(dir: string, acc: string[] = []): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function buildRegistry(): DocEntry[] {
  const root = process.cwd();
  const docsDir = path.join(root, "docs");
  const local: DocEntry[] = [];
  const seen = new Set<string>();

  for (const full of walk(docsDir)) {
    const rel = path.relative(root, full).split(path.sep).join("/");
    if (isExcluded(rel)) continue;

    let raw: string;
    try {
      raw = fs.readFileSync(full, "utf-8");
    } catch {
      continue;
    }

    const fm = parseFrontmatter(raw);
    const section = sectionFor(fm, rel);
    if (!section) continue; // no frontmatter type → invisible, by design

    let id = slugFor(fm, rel);
    if (seen.has(id)) id = `${id}-${local.length}`; // collision guard
    seen.add(id);

    local.push({
      id,
      title: extractTitle(raw, rel),
      section,
      docType: fm.type,
      status: fm.status,
      shipped: fm.shipped,
      tags: fm.tags ?? [],
      path: rel,
      source: { type: "local", file: rel },
      generated: fm.type ? GENERATED.has(fm.type) : false,
    });
  }

  local.sort((a, b) => a.title.localeCompare(b.title));
  return [...local, ...REMOTE_DOCS.filter((r) => !seen.has(r.id))];
}

let _cache: DocEntry[] | null = null;

/** Auto-walked registry. No manual whitelist — add a doc, it appears. */
export function getDocsRegistry(): DocEntry[] {
  if (!_cache) _cache = buildRegistry();
  return _cache;
}

export function getDoc(id: string): DocEntry | undefined {
  return getDocsRegistry().find((d) => d.id === id);
}

export function groupBySection(docs: DocEntry[]): { section: DocSection; label: string; blurb: string; docs: DocEntry[] }[] {
  return DOC_SECTIONS.map((s) => ({
    section: s.id,
    label: s.label,
    blurb: s.blurb,
    docs: docs.filter((d) => d.section === s.id),
  })).filter((g) => g.docs.length > 0);
}

// Search lives in ./docs-filter — this module imports `fs`, so client components
// must never import from here. See the note at the top of docs-filter.ts.

/** Status badge text + intent. PRDs additionally show shipped vs planned. */
export function statusBadge(d: DocEntry): { label: string; tone: "ok" | "warn" | "muted" | "accent" } | null {
  if (d.docType === "prd") {
    if (d.shipped === true) return { label: "shipped", tone: "ok" };
    if (d.shipped === false) return { label: "planned", tone: "accent" };
  }
  switch (d.status) {
    case "draft": return { label: "draft", tone: "warn" };
    case "locked": return { label: "locked", tone: "accent" };
    case "done": return { label: "done", tone: "ok" };
    case "deprecated": return { label: "deprecated", tone: "muted" };
    case "active": return { label: "active", tone: "muted" };
    default: return null;
  }
}
