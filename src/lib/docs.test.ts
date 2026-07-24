import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  fetchMarkdown, fetchDocUpdated, getDocsRegistry, getDoc, groupBySection,
  DOC_SECTIONS, stripCodeFences, stripHtmlComments, stripFrontmatterBlock,
  parseFrontmatter, tidyFilename, extractTitle, isExcluded, sectionFor,
  slugFor, statusBadge, type DocEntry,
} from "./docs";
import { matchesQuery } from "./docs-filter";

describe("fetchMarkdown — local source", () => {
  it("returns file content when the file exists", async () => {
    const result = await fetchMarkdown({ type: "local", file: "docs/README-DOCS.md" });
    expect(result).not.toBeNull();
    expect(result).toContain("How this doc system works");
  });

  it("returns null (not throws) when the file does not exist", async () => {
    expect(await fetchMarkdown({ type: "local", file: "docs/does-not-exist.md" })).toBeNull();
  });
});

describe("fetchMarkdown — github source", () => {
  beforeEach(() => void vi.restoreAllMocks());

  it("returns markdown content on 200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => "# Hello\n\nContent." }));
    const result = await fetchMarkdown({
      type: "github", repo: "thirstypig/tastemakers-backend", branch: "main", file: "CLAUDE.md",
    });
    expect(result).toBe("# Hello\n\nContent.");
  });

  it("returns null when GitHub returns non-200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    const result = await fetchMarkdown({
      type: "github", repo: "thirstypig/tastemakers-backend", branch: "main", file: "nope.md",
    });
    expect(result).toBeNull();
  });

  it("returns null (not throws) on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const result = await fetchMarkdown({
      type: "github", repo: "thirstypig/tastemakers-backend", branch: "main", file: "CLAUDE.md",
    });
    expect(result).toBeNull();
  });

  it("fetches via the GitHub Contents API with a raw accept header", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, text: async () => "content" });
    vi.stubGlobal("fetch", mockFetch);
    await fetchMarkdown({
      type: "github", repo: "thirstypig/tastemakers-backend", branch: "main", file: "todos/README.md",
    });
    const [url, init] = mockFetch.mock.lastCall!;
    expect(url).toBe(
      "https://api.github.com/repos/thirstypig/tastemakers-backend/contents/todos%2FREADME.md?ref=main",
    );
    expect((init.headers as Record<string, string>).Accept).toBe("application/vnd.github.raw+json");
  });
});

/* ─────────────────────────── title extraction ─────────────────────────── */

describe("stripCodeFences", () => {
  it("removes a fenced block", () => {
    expect(stripCodeFences("a\n```\ncode\n```\nb")).toBe("a\n\nb");
  });

  it("removes multiple fenced blocks independently (non-greedy)", () => {
    const out = stripCodeFences("a\n```\nx\n```\nKEEP\n```\ny\n```\nb");
    expect(out).toContain("KEEP");
    expect(out).not.toContain("x");
    expect(out).not.toContain("y");
  });
});

describe("extractTitle", () => {
  it("uses the first H1", () => {
    expect(extractTitle("# Real Title\n\nbody", "docs/x.md")).toBe("Real Title");
  });

  it("skips frontmatter and finds the H1 after it", () => {
    const raw = "---\nid: DOC-001\ntype: guide\n---\n\n# After Frontmatter\n";
    expect(extractTitle(raw, "docs/x.md")).toBe("After Frontmatter");
  });

  // The bug this guard exists for.
  it("does NOT treat a '#' comment inside a bash block as the title", () => {
    const raw = "---\ntype: runbook\n---\n\n```bash\n# npm run docs:refresh\n```\n\n# Actual Title\n";
    expect(extractTitle(raw, "docs/x.md")).toBe("Actual Title");
  });

  it("does not treat a '#' inside an HTML comment as the title", () => {
    const raw = "---\ntype: guide\n---\n\n<!--\n# Not the title\n-->\n\n# Real One\n";
    expect(extractTitle(raw, "docs/x.md")).toBe("Real One");
  });

  it("ignores H2 and deeper", () => {
    expect(extractTitle("## Not H1\n\n# Yes H1", "docs/x.md")).toBe("Yes H1");
  });

  it("falls back to the frontmatter title when there is no H1", () => {
    const raw = "---\ntype: solution\ntitle: \"Fallback From Frontmatter\"\n---\n\nbody only\n";
    expect(extractTitle(raw, "docs/x.md")).toBe("Fallback From Frontmatter");
  });

  it("falls back to a tidy filename when there is no H1 and no title", () => {
    expect(extractTitle("just body text", "docs/some-file-name.md")).toBe("Some File Name");
  });

  it("trims trailing whitespace from the H1", () => {
    expect(extractTitle("#   Spaced Out   \n", "docs/x.md")).toBe("Spaced Out");
  });
});

describe("tidyFilename", () => {
  it("title-cases and de-hyphenates", () => {
    expect(tidyFilename("docs/a/admin-docs-dashboard.md")).toBe("Admin Docs Dashboard");
  });

  it("strips a leading ISO date", () => {
    expect(tidyFilename("2026-06-09-admin-docs-dashboard.md")).toBe("Admin Docs Dashboard");
  });
});

/* ───────────────────────────── frontmatter ───────────────────────────── */

describe("parseFrontmatter", () => {
  it("parses scalars, arrays, booleans and nulls", () => {
    const fm = parseFrontmatter(
      "---\nid: PRD-001\ntype: prd\nshipped: true\nphase: null\ntags: [tagging, backend]\n---\n# x",
    );
    expect(fm.id).toBe("PRD-001");
    expect(fm.type).toBe("prd");
    expect(fm.shipped).toBe(true);
    expect(fm.tags).toEqual(["tagging", "backend"]);
  });

  it("strips quotes from array items (legacy solutions docs)", () => {
    const fm = parseFrontmatter('---\ntype: solution\ntags: ["nextjs", "railway"]\n---\n');
    expect(fm.tags).toEqual(["nextjs", "railway"]);
  });

  it("returns an empty object when there is no frontmatter", () => {
    expect(parseFrontmatter("# No frontmatter")).toEqual({});
  });

  it("returns an empty object on an unterminated block instead of throwing", () => {
    expect(parseFrontmatter("---\nid: X\nnever closed")).toEqual({});
  });

  it("ignores nested list syntax it cannot represent", () => {
    const fm = parseFrontmatter("---\ntype: solution\nsymptoms:\n  - \"one\"\n  - \"two\"\n---\n");
    expect(fm.type).toBe("solution");
  });
});

describe("stripFrontmatterBlock", () => {
  it("leaves content without frontmatter untouched", () => {
    expect(stripFrontmatterBlock("# Title")).toBe("# Title");
  });
});

describe("stripHtmlComments", () => {
  it("removes multi-line comments", () => {
    expect(stripHtmlComments("a<!--\nx\n-->b")).toBe("ab");
  });
});

/* ───────────────────────────── exclusions ───────────────────────────── */

describe("isExcluded", () => {
  it("excludes templates", () => {
    expect(isExcluded("docs/_templates/prd.template.md")).toBe(true);
  });

  it("excludes underscore-prefixed files", () => {
    expect(isExcluded("docs/_comments.json")).toBe(true);
  });

  it("excludes non-markdown files", () => {
    expect(isExcluded("docs/costs.config.json")).toBe(true);
  });

  it("excludes dotfiles and dot-directories", () => {
    expect(isExcluded("docs/.DS_Store")).toBe(true);
    expect(isExcluded("docs/.hidden/x.md")).toBe(true);
  });

  it("includes ordinary nested markdown", () => {
    expect(isExcluded("docs/product/prds/PRD-001-x.md")).toBe(false);
  });
});

/* ────────────────────────────── grouping ────────────────────────────── */

describe("sectionFor", () => {
  it("maps type to section", () => {
    expect(sectionFor({ type: "prd" }, "docs/product/prds/x.md")).toBe("product");
    expect(sectionFor({ type: "adr" }, "docs/engineering/adrs/x.md")).toBe("engineering");
    expect(sectionFor({ type: "runbook" }, "docs/under-the-hood/x.md")).toBe("operations");
    expect(sectionFor({ type: "inbox" }, "docs/INBOX.md")).toBe("inbox");
  });

  it("files by intent, not folder — a solution under product/ still lands in troubleshooting", () => {
    expect(sectionFor({ type: "solution" }, "docs/product/weird-place.md")).toBe("troubleshooting");
  });

  it("uses the path override when a doc has no type", () => {
    expect(sectionFor({}, "docs/solutions/build-errors/x.md")).toBe("troubleshooting");
    expect(sectionFor({}, "docs/superpowers/plans/x.md")).toBe("notes");
  });

  it("returns null for an untyped doc outside any override", () => {
    expect(sectionFor({}, "docs/random.md")).toBeNull();
  });

  it("returns null for an unknown type", () => {
    expect(sectionFor({ type: "nonsense" }, "docs/x.md")).toBeNull();
  });
});

describe("groupBySection", () => {
  const docs = [
    { section: "product", title: "B" }, { section: "product", title: "A" },
    { section: "notes", title: "C" }, { section: "inbox", title: "D" },
  ] as DocEntry[];

  it("drops empty sections", () => {
    expect(groupBySection(docs).map((g) => g.section)).toEqual(["inbox", "product", "notes"]);
  });

  it("orders inbox first and notes last", () => {
    const order = groupBySection(docs).map((g) => g.section);
    expect(order[0]).toBe("inbox");
    expect(order[order.length - 1]).toBe("notes");
  });

  it("gives every section a one-line blurb", () => {
    for (const s of DOC_SECTIONS) expect(s.blurb.length).toBeGreaterThan(10);
  });
});

describe("slugFor", () => {
  it("prefers the frontmatter id, lowercased", () => {
    expect(slugFor({ id: "PRD-001" }, "docs/product/prds/x.md")).toBe("prd-001");
  });

  it("derives a slug from the path when there is no id", () => {
    expect(slugFor({}, "docs/solutions/ui-bugs/marked.md")).toBe("solutions-ui-bugs-marked");
  });
});

// Guards the client/server boundary documented in SOL-004. `docs.ts` imports `fs`, so a
// "use client" component importing from it breaks `next build` with
// "Module not found: Can't resolve 'fs'" — a failure neither typecheck nor these tests
// would otherwise catch.
describe("client/server boundary (SOL-004)", () => {
  const CLIENT_COMPONENTS = ["src/app/admin/docs/DocsBrowser.tsx"];

  it("no client component imports the fs-using docs module", () => {
    for (const rel of CLIENT_COMPONENTS) {
      const src = fs.readFileSync(path.join(process.cwd(), rel), "utf-8");
      expect(src, `${rel} must be marked "use client"`).toMatch(/^["']use client["']/);
      expect(src, `${rel} imports @/lib/docs, which imports fs — use @/lib/docs-filter`)
        .not.toMatch(/from\s+["']@\/lib\/docs["']/);
    }
  });

  it("docs-filter stays free of node builtins so it is browser-safe", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "src/lib/docs-filter.ts"), "utf-8");
    expect(src).not.toMatch(/from\s+["']node:/);
    expect(src).not.toMatch(/^\s*import\s+\w+\s+from\s+["'](fs|path|child_process|os)["']/m);
  });
});

describe("matchesQuery", () => {
  const doc = {
    title: "Restaurant tagging & voting",
    id: "prd-001",
    path: "docs/product/prds/PRD-001-restaurant-tagging-and-voting.md",
    tags: ["tagging", "backend", "ios"],
  };

  it("matches on title, case-insensitively", () => {
    expect(matchesQuery(doc, "TAGGING")).toBe(true);
  });

  it("matches on id", () => {
    expect(matchesQuery(doc, "prd-001")).toBe(true);
  });

  it("matches on path", () => {
    expect(matchesQuery(doc, "product/prds")).toBe(true);
  });

  it("matches on a tag", () => {
    expect(matchesQuery(doc, "ios")).toBe(true);
  });

  it("returns false when nothing matches", () => {
    expect(matchesQuery(doc, "kubernetes")).toBe(false);
  });

  it("treats an empty or whitespace query as matching everything", () => {
    expect(matchesQuery(doc, "")).toBe(true);
    expect(matchesQuery(doc, "   ")).toBe(true);
  });
});

describe("statusBadge", () => {
  it("shows shipped vs planned on PRDs", () => {
    expect(statusBadge({ docType: "prd", shipped: true } as DocEntry)?.label).toBe("shipped");
    expect(statusBadge({ docType: "prd", shipped: false } as DocEntry)?.label).toBe("planned");
  });

  it("falls back to status for non-PRDs", () => {
    expect(statusBadge({ docType: "adr", status: "draft" } as DocEntry)?.label).toBe("draft");
    expect(statusBadge({ docType: "launch-spec", status: "locked" } as DocEntry)?.label).toBe("locked");
  });

  it("returns null when there is nothing to show", () => {
    expect(statusBadge({ docType: "note" } as DocEntry)).toBeNull();
  });
});

/* ──────────────────────── registry (integration) ──────────────────────── */

describe("getDocsRegistry", () => {
  const registry = getDocsRegistry();

  it("finds the real docs on disk without a manual whitelist", () => {
    expect(registry.length).toBeGreaterThan(20);
  });

  it("has unique ids", () => {
    const ids = registry.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("indexes PRD-001 with a real title from its H1", () => {
    const prd = registry.find((d) => d.id === "prd-001");
    expect(prd?.title).toBe("Restaurant tagging & voting");
    expect(prd?.section).toBe("product");
    expect(prd?.shipped).toBe(true);
  });

  it("never indexes a template", () => {
    expect(registry.some((d) => d.path.includes("_templates"))).toBe(false);
  });

  it("every local source file exists on disk", () => {
    for (const d of registry) {
      if (d.source.type === "local") {
        expect(fs.existsSync(path.join(process.cwd(), d.source.file)), `${d.id} → ${d.source.file}`).toBe(true);
      }
    }
  });

  it("every entry lands in a known section", () => {
    const known = DOC_SECTIONS.map((s) => s.id);
    for (const d of registry) expect(known).toContain(d.section);
  });

  it("getDoc resolves every id and rejects unknown ids", () => {
    for (const d of registry) expect(getDoc(d.id)?.id).toBe(d.id);
    expect(getDoc("nope")).toBeUndefined();
  });

  it("still includes the cross-repo GitHub docs", () => {
    expect(registry.find((d) => d.id === "backend-claude")?.source.type).toBe("github");
  });
});

describe("fetchDocUpdated", () => {
  it("returns mtime date for local files", async () => {
    expect(await fetchDocUpdated({ type: "local", file: "package.json" })).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns latest commit date for github files", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, json: async () => [{ commit: { committer: { date: "2026-06-01T10:00:00Z" } } }],
    });
    vi.stubGlobal("fetch", mockFetch);
    const date = await fetchDocUpdated({
      type: "github", repo: "thirstypig/tastemakers-backend", branch: "main", file: "CLAUDE.md",
    });
    expect(date).toBe("2026-06-01");
    vi.unstubAllGlobals();
  });

  it("returns null when github fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchDocUpdated({ type: "github", repo: "x/y", branch: "main", file: "z.md" })).toBeNull();
    vi.unstubAllGlobals();
  });

  it("returns null for a missing local file instead of throwing", async () => {
    expect(await fetchDocUpdated({ type: "local", file: "docs/does-not-exist.md" })).toBeNull();
  });
});
