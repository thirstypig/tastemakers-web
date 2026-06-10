import { describe, it, expect, vi, afterEach } from "vitest";
import { posthogQuery, fetchWebStats } from "./posthog";

afterEach(() => vi.unstubAllGlobals());

describe("posthogQuery", () => {
  it("POSTs HogQL with bearer auth and returns results", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [["a", 1]] }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const out = await posthogQuery("key", "SELECT 1");
    expect(out).toEqual([["a", 1]]);
    const [url, init] = mockFetch.mock.lastCall!;
    expect(url).toContain("/api/projects/455919/query/");
    expect(init.headers.Authorization).toBe("Bearer key");
  });

  it("returns null on non-ok response and on throw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await posthogQuery("key", "SELECT 1")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    expect(await posthogQuery("key", "SELECT 1")).toBeNull();
  });
});

describe("fetchWebStats", () => {
  it("maps rows to day/views/visitors and returns true distinct visitors", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true, json: async () => ({ results: [["2026-06-08", 42, 7]] }),
      })
      .mockResolvedValueOnce({
        ok: true, json: async () => ({ results: [[9]] }),
      });
    vi.stubGlobal("fetch", mockFetch);
    expect(await fetchWebStats("key")).toEqual({
      days: [{ day: "2026-06-08", views: 42, visitors: 7 }],
      visitors: 9,
    });
  });
});
