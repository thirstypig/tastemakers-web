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
