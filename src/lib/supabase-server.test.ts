import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * todo 095 — `createServerClient()` (the public data layer) must resolve its
 * Supabase URL/anon key through the server-env helper, which accepts EITHER the
 * unprefixed `SUPABASE_*` or the `NEXT_PUBLIC_SUPABASE_*` name. Before 095 it read
 * `NEXT_PUBLIC_` directly, so a deploy that set only the unprefixed pair left the
 * public pages broken while auth/tagging worked.
 *
 * These tests guard the wiring, not just the helper: they mock the Supabase
 * boundary and assert `createServerClient()` hands it the resolved values. Revert
 * `supabase-server.ts` to `process.env.NEXT_PUBLIC_SUPABASE_URL!` and the
 * "unprefixed only" case below fails — which is exactly the footgun returning.
 */
const { createClient } = vi.hoisted(() => ({ createClient: vi.fn(() => ({ mocked: true })) }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

const keys = [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

describe("createServerClient env resolution", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    createClient.mockClear();
    for (const k of keys) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("builds a client from the unprefixed pair alone (the footgun scenario)", async () => {
    process.env.SUPABASE_URL = "https://server.example";
    process.env.SUPABASE_ANON_KEY = "server-anon";

    const { createServerClient } = await import("./supabase-server");
    createServerClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://server.example",
      "server-anon",
      expect.anything(),
    );
  });

  it("falls back to the NEXT_PUBLIC_ pair when the unprefixed one is unset", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.example";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon";

    vi.resetModules();
    const { createServerClient } = await import("./supabase-server");
    createServerClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://public.example",
      "public-anon",
      expect.anything(),
    );
  });
});
