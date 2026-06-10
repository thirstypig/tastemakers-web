import fs from "fs";
import path from "path";

export type DocSource =
  | { type: "local"; file: string }
  | { type: "github"; repo: string; branch: string; file: string };

export async function fetchMarkdown(source: DocSource): Promise<string | null> {
  if (source.type === "local") {
    try {
      return fs.readFileSync(path.join(process.cwd(), source.file), "utf-8");
    } catch {
      return null;
    }
  }
  const url = `https://raw.githubusercontent.com/${source.repo}/${source.branch}/${source.file}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } } as RequestInit);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export type DocCategory = "planning" | "operations" | "product" | "reference" | "context";

export type DocEntry = {
  id: string;
  title: string;
  category: DocCategory;
  source: DocSource;
};

export const DOC_CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: "planning", label: "planning" },
  { id: "operations", label: "operations" },
  { id: "product", label: "product" },
  { id: "reference", label: "reference" },
  { id: "context", label: "context" },
];

const BACKEND = "thirstypig/tastemakers-backend";

export const DOCS_REGISTRY: DocEntry[] = [
  { id: "going-live", title: "Going-Live Runbook", category: "planning",
    source: { type: "local", file: "src/content/docs/going-live.md" } },
  { id: "cross-todos", title: "Cross-Project Todos", category: "planning",
    source: { type: "local", file: "src/content/docs/cross-todos.md" } },
  { id: "operations", title: "Operations Runbook", category: "operations",
    source: { type: "local", file: "src/content/docs/operations.md" } },
  { id: "architecture", title: "System Architecture", category: "operations",
    source: { type: "local", file: "src/content/docs/architecture.md" } },
  { id: "metrics", title: "Metrics & KPI Definitions", category: "product",
    source: { type: "local", file: "src/content/docs/metrics.md" } },
  { id: "master-ports", title: "MASTER-PORTS.md", category: "reference",
    source: { type: "github", repo: BACKEND, branch: "main", file: "MASTER-PORTS.md" } },
  { id: "backend-readme", title: "Backend README", category: "reference",
    source: { type: "github", repo: BACKEND, branch: "main", file: "README.md" } },
  { id: "root-claude", title: "Root — CLAUDE.md", category: "context",
    source: { type: "local", file: "src/content/docs/root-claude.md" } },
  { id: "backend-claude", title: "Backend — CLAUDE.md", category: "context",
    source: { type: "github", repo: BACKEND, branch: "main", file: "CLAUDE.md" } },
  { id: "web-claude", title: "Web — CLAUDE.md", category: "context",
    source: { type: "github", repo: "thirstypig/tastemakers-web", branch: "main", file: "CLAUDE.md" } },
  { id: "ios-claude", title: "iOS — CLAUDE.md", category: "context",
    source: { type: "github", repo: "thirstypig/tastemakers-ios", branch: "master", file: "CLAUDE.md" } },
  { id: "android-claude", title: "Android — CLAUDE.md", category: "context",
    source: { type: "github", repo: "thirstypig/tastemakers-android", branch: "main", file: "CLAUDE.md" } },
  { id: "backend-todos", title: "Backend Todos", category: "context",
    source: { type: "github", repo: BACKEND, branch: "main", file: "todos/README.md" } },
];

export function getDoc(id: string): DocEntry | undefined {
  return DOCS_REGISTRY.find((d) => d.id === id);
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
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 300 },
    } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.[0]?.commit?.committer?.date as string | undefined)?.slice(0, 10) ?? null;
  } catch {
    return null;
  }
}
