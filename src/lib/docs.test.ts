import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchMarkdown } from "./docs";

describe("fetchMarkdown — local source", () => {
  it("returns file content when the file exists", async () => {
    // Points at a real file in the repo
    const result = await fetchMarkdown({
      type: "local",
      file: "src/content/docs/going-live.md",
    });
    expect(result).not.toBeNull();
    expect(result).toContain("Going Live");
  });

  it("returns null (not throws) when the file does not exist", async () => {
    const result = await fetchMarkdown({
      type: "local",
      file: "src/content/docs/does-not-exist.md",
    });
    expect(result).toBeNull();
  });
});

describe("fetchMarkdown — github source", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns markdown content on 200 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "# Hello\n\nContent here.",
    }));

    const result = await fetchMarkdown({
      type: "github",
      repo: "thirstypig/tastemakers-backend",
      branch: "main",
      file: "CLAUDE.md",
    });

    expect(result).toBe("# Hello\n\nContent here.");
  });

  it("returns null when GitHub returns non-200 (e.g. 404)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const result = await fetchMarkdown({
      type: "github",
      repo: "thirstypig/tastemakers-backend",
      branch: "main",
      file: "nonexistent.md",
    });

    expect(result).toBeNull();
  });

  it("returns null (not throws) on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await fetchMarkdown({
      type: "github",
      repo: "thirstypig/tastemakers-backend",
      branch: "main",
      file: "CLAUDE.md",
    });

    expect(result).toBeNull();
  });

  it("fetches from the correct raw GitHub URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "content",
    });
    vi.stubGlobal("fetch", mockFetch);

    await fetchMarkdown({
      type: "github",
      repo: "thirstypig/tastemakers-backend",
      branch: "main",
      file: "todos/README.md",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/thirstypig/tastemakers-backend/main/todos/README.md",
      expect.any(Object)
    );
  });
});

import { DOCS_REGISTRY, DOC_CATEGORIES, getDoc, fetchDocUpdated } from "./docs";
import fs from "fs";
import path from "path";

describe("DOCS_REGISTRY", () => {
  it("has unique ids", () => {
    const ids = DOCS_REGISTRY.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has a category defined in DOC_CATEGORIES", () => {
    const cats = DOC_CATEGORIES.map((c) => c.id);
    for (const d of DOCS_REGISTRY) expect(cats).toContain(d.category);
  });

  it("every local source file exists on disk", () => {
    for (const d of DOCS_REGISTRY) {
      if (d.source.type === "local") {
        expect(
          fs.existsSync(path.join(process.cwd(), d.source.file)),
          `${d.id} → ${d.source.file}`,
        ).toBe(true);
      }
    }
  });

  it("getDoc resolves every registry id and rejects unknown ids", () => {
    for (const d of DOCS_REGISTRY) expect(getDoc(d.id)?.id).toBe(d.id);
    expect(getDoc("nope")).toBeUndefined();
  });
});

describe("fetchDocUpdated", () => {
  it("returns mtime date for local files", async () => {
    const date = await fetchDocUpdated({ type: "local", file: "package.json" });
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns latest commit date for github files", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ commit: { author: { date: "2026-06-01T10:00:00Z" } } }],
    });
    vi.stubGlobal("fetch", mockFetch);
    const date = await fetchDocUpdated({
      type: "github", repo: "thirstypig/tastemakers-backend", branch: "main", file: "CLAUDE.md",
    });
    expect(date).toBe("2026-06-01");
    expect(mockFetch.mock.lastCall![0]).toContain("path=CLAUDE.md");
    vi.unstubAllGlobals();
  });

  it("returns null when github fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const date = await fetchDocUpdated({
      type: "github", repo: "x/y", branch: "main", file: "z.md",
    });
    expect(date).toBeNull();
    vi.unstubAllGlobals();
  });
});
