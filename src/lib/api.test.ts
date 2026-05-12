import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "./api";

const mockFetch = vi.fn();

describe("apiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();          // clears call history on mockFetch
    vi.restoreAllMocks();        // restores any stubbed globals
    vi.stubGlobal("fetch", mockFetch);
  });

  // ── response handling ──────────────────────────────────────────────────────

  it("returns parsed JSON on 200", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    const result = await apiFetch<{ id: number }>("/users/1");
    expect(result).toEqual({ id: 1 });
  });

  it("throws 'API error: 404' on not-found", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    await expect(apiFetch("/missing")).rejects.toThrow("API error: 404");
  });

  it("throws 'API error: 500' on server error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(apiFetch("/crash")).rejects.toThrow("API error: 500");
  });

  it("throws 'API error: 401' on unauthenticated", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(apiFetch("/me")).rejects.toThrow("API error: 401");
  });

  it("propagates network errors without swallowing them", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));
    await expect(apiFetch("/health")).rejects.toThrow("Network failure");
  });

  // ── request construction ───────────────────────────────────────────────────

  it("prepends API_BASE to the path", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await apiFetch("/health");
    const [url] = mockFetch.mock.lastCall!;
    expect(url).toMatch(/\/health$/);
  });

  it("always sends Content-Type: application/json", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await apiFetch("/health");
    const [, init] = mockFetch.mock.lastCall!;
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("omits Authorization header when window is undefined (SSR / no token)", async () => {
    // In node env window is undefined — the SSR-safe branch runs
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await apiFetch("/health");
    const [, init] = mockFetch.mock.lastCall!;
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("adds Authorization: Bearer <token> when localStorage has a token", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", { getItem: vi.fn().mockReturnValue("tok-abc") });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await apiFetch("/me");
    const [, init] = mockFetch.mock.lastCall!;
    expect(init.headers["Authorization"]).toBe("Bearer tok-abc");
  });

  it("omits Authorization when localStorage token is null", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", { getItem: vi.fn().mockReturnValue(null) });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await apiFetch("/health");
    const [, init] = mockFetch.mock.lastCall!;
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("forwards method and body from options", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "pass" }),
    });
    const [, init] = mockFetch.mock.lastCall!;
    expect(init.method).toBe("POST");
    expect(init.body).toContain("a@b.com");
  });

  it("caller headers override the default Content-Type", async () => {
    // Needed when posting FormData or multipart
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    await apiFetch("/upload", {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const [, init] = mockFetch.mock.lastCall!;
    expect(init.headers["Content-Type"]).toBe("multipart/form-data");
  });
});
