import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } from "./server-env";

/**
 * todo 095 — server code resolves the Supabase URL/anon key through one helper
 * that accepts either the unprefixed or the NEXT_PUBLIC_ name, unprefixed first.
 * Before this, the data layer read NEXT_PUBLIC_ while the auth/tag paths read the
 * unprefixed pair, so setting only one pair broke half the app silently.
 */
describe("supabase server-env resolution", () => {
  const saved: Record<string, string | undefined> = {};
  const keys = [
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  beforeEach(() => {
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

  it("prefers the unprefixed URL when both are set", () => {
    process.env.SUPABASE_URL = "https://unprefixed.example";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.example";
    expect(supabaseUrl()).toBe("https://unprefixed.example");
  });

  it("falls back to NEXT_PUBLIC_ URL when the unprefixed one is unset", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.example";
    expect(supabaseUrl()).toBe("https://public.example");
  });

  it("prefers the unprefixed anon key, falling back to NEXT_PUBLIC_", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon";
    expect(supabaseAnonKey()).toBe("public-anon");
    process.env.SUPABASE_ANON_KEY = "server-anon";
    expect(supabaseAnonKey()).toBe("server-anon");
  });

  it("returns undefined when neither pair is set", () => {
    expect(supabaseUrl()).toBeUndefined();
    expect(supabaseAnonKey()).toBeUndefined();
  });

  it("reads the service-role key only from its own (server-only) name", () => {
    expect(supabaseServiceRoleKey()).toBeUndefined();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    expect(supabaseServiceRoleKey()).toBe("service-key");
  });
});
