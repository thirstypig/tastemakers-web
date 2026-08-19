import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The OAuth callback took `?next` straight from the query string and redirected
 * to `${origin}${next}` with no validation.
 *
 * `${origin}${next}` looks same-origin, which is why this survived review — but
 * string concatenation is not URL construction. `next=@evil.com` yields
 * `https://www.tastemakersapp.com@evil.com`, where everything before the `@` is
 * userinfo and the real host is `evil.com`. `next=.evil.com` yields
 * `https://www.tastemakersapp.com.evil.com`, a domain an attacker can register.
 * Either one bounces a freshly-authenticated user off-site, which is exactly the
 * moment they are most likely to trust what they land on.
 *
 * `safeRedirectPath` in `src/lib/auth.ts` already existed and was already tested
 * — the login page uses it. This route never called it. These tests assert on
 * the resolved host of the Location header, so they fail for any bypass rather
 * than for one spelling of one payload.
 */

const exchangeCodeForSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      exchangeCodeForSession,
      getUser: async () => ({ data: { user: null }, error: null }),
      updateUser: async () => ({ data: {}, error: null }),
    },
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

const ORIGIN = "https://www.tastemakersapp.com";

/** The host a browser would actually navigate to, not the raw string. */
async function redirectHost(next: string): Promise<string> {
  const { GET } = await import("./route");
  const request = new Request(
    `${ORIGIN}/auth/callback?code=valid-code&next=${encodeURIComponent(next)}`,
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await GET(request as any);
  const location = response.headers.get("location")!;

  return new URL(location).host;
}

describe("OAuth callback redirect target", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SITE_URL = ORIGIN;
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key";
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("keeps a normal relative path", async () => {
    expect(await redirectHost("/explore")).toBe("www.tastemakersapp.com");
  });

  it("does not send the user to a host smuggled in via userinfo", async () => {
    expect(await redirectHost("@evil.com")).toBe("www.tastemakersapp.com");
  });

  it("does not send the user to a lookalike domain suffix", async () => {
    expect(await redirectHost(".evil.com")).toBe("www.tastemakersapp.com");
  });

  it("does not honour a protocol-relative path", async () => {
    expect(await redirectHost("//evil.com")).toBe("www.tastemakersapp.com");
  });

  it("does not honour an absolute URL", async () => {
    expect(await redirectHost("https://evil.com/phish")).toBe("www.tastemakersapp.com");
  });
});
