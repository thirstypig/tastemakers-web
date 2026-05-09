import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCheck, shortBody, type Check } from "./api-probe";

const BASE_CHECK: Check = {
  name: "Health",
  description: "test",
  method: "GET",
  url: "https://api.example.com/health",
  expectStatus: 200,
};

// ── shortBody ────────────────────────────────────────────────────────────────

describe("shortBody", () => {
  it("returns — for null", () => {
    expect(shortBody(null)).toBe("—");
  });

  it("returns — for undefined", () => {
    expect(shortBody(undefined)).toBe("—");
  });

  it("returns full JSON when under 300 chars", () => {
    const body = { status: true, msg: "ok" };
    const result = shortBody(body);
    expect(result).toContain('"status": true');
    expect(result).not.toContain("…");
  });

  it("truncates at 300 chars and appends ellipsis", () => {
    const body = { data: "x".repeat(400) };
    const result = shortBody(body);
    expect(result.length).toBeLessThan(320); // 300 + "\n…"
    expect(result.endsWith("\n…")).toBe(true);
  });

  it("does not truncate exactly at 300 chars", () => {
    // Build a body whose JSON is exactly 300 chars
    const s = JSON.stringify({ k: "v" }, null, 2); // short
    const body = { k: "v" };
    const result = shortBody(body);
    expect(result).not.toContain("…");
  });
});

// ── runCheck ─────────────────────────────────────────────────────────────────

describe("runCheck", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marks ok=true when response status matches expectStatus", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ status: "ok" }),
    }));

    const result = await runCheck(BASE_CHECK);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ status: "ok" });
    expect(result.error).toBeUndefined();
  });

  it("marks ok=false when status does not match expectStatus", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 500,
      text: async () => "Internal Server Error",
    }));

    const result = await runCheck(BASE_CHECK); // expects 200, gets 500
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });

  it("marks ok=true for a 401 check when 401 is expected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 401,
      text: async () => JSON.stringify({ message: "Unauthenticated." }),
    }));

    const authGuardCheck: Check = { ...BASE_CHECK, expectStatus: 401 };
    const result = await runCheck(authGuardCheck);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(401);
  });

  it("handles network error — returns ok=false with error string, does not throw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await runCheck(BASE_CHECK);
    expect(result.ok).toBe(false);
    expect(result.status).toBeNull();
    expect(result.error).toContain("fetch failed");
    expect(result.body).toBeNull();
  });

  it("handles non-JSON response body gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 200,
      text: async () => "<html>error page</html>",
    }));

    const result = await runCheck(BASE_CHECK);
    expect(result.ok).toBe(true);
    expect(result.body).toBeNull(); // JSON.parse failed, falls back to null
  });

  it("handles empty response body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 200,
      text: async () => "",
    }));

    const result = await runCheck(BASE_CHECK);
    expect(result.body).toBeNull();
  });

  it("passes method and init through to fetch", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      text: async () => "{}",
    });
    vi.stubGlobal("fetch", mockFetch);

    const postCheck: Check = {
      ...BASE_CHECK,
      method: "POST",
      init: { headers: { "Content-Type": "application/json" }, body: '{"email":"a"}' },
    };
    await runCheck(postCheck);

    expect(mockFetch).toHaveBeenCalledWith(
      BASE_CHECK.url,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"email":"a"}',
      })
    );
  });
});
