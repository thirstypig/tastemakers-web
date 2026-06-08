// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCommits } from "./github";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function githubCommit(sha: string, date: string, message: string) {
  return { sha, commit: { author: { date }, message } };
}

describe("fetchCommits", () => {
  it("returns shaped commits on a 200 response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        githubCommit("abc1234567890", "2026-06-08T12:00:00Z", "feat: add admin panel"),
      ],
    });

    const commits = await fetchCommits("thirstypig/tastemakers-web");
    expect(commits).toHaveLength(1);
    expect(commits[0].sha).toBe("abc1234");       // truncated to 7
    expect(commits[0].date).toBe("2026-06-08");   // truncated to 10
    expect(commits[0].subject).toBe("feat: add admin panel");
  });

  it("truncates subject to 72 characters", async () => {
    const longMessage = "feat: " + "a".repeat(80);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [githubCommit("abc1234", "2026-06-08T00:00:00Z", longMessage)],
    });

    const commits = await fetchCommits("thirstypig/tastemakers-web");
    expect(commits[0].subject).toHaveLength(72);
  });

  it("uses only the first line of a multi-line commit message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        githubCommit("abc1234", "2026-06-08T00:00:00Z", "feat: title\n\nBody paragraph here"),
      ],
    });

    const commits = await fetchCommits("thirstypig/tastemakers-web");
    expect(commits[0].subject).toBe("feat: title");
  });

  it("returns [] on a non-OK response (private repo / rate limit)", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    expect(await fetchCommits("thirstypig/tastemakers-ios")).toEqual([]);
  });

  it("returns [] on a 403 rate-limit response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });
    expect(await fetchCommits("thirstypig/tastemakers-web")).toEqual([]);
  });

  it("returns [] when fetch throws (network error)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    expect(await fetchCommits("thirstypig/tastemakers-web")).toEqual([]);
  });

  it("sends the correct GitHub API Accept header", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    await fetchCommits("thirstypig/tastemakers-web");
    expect(mockFetch.mock.lastCall![1].headers.Accept).toBe(
      "application/vnd.github.v3+json"
    );
  });
});
