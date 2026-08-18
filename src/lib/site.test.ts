import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_ORIGIN, canonical } from "./site";

/**
 * `CANONICAL_ORIGIN` is computed once at module load, so exercising the env var
 * means resetting the module registry and re-importing rather than stubbing and
 * calling again. That mirrors production: the value is fixed at build time.
 */
async function importWithEnv(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v as string);
  return import("./site");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("canonical", () => {
  it("keeps the trailing slash on the root, matching what is already indexed", () => {
    expect(canonical("/")).toBe("https://app.tastemakersapp.com/");
    expect(canonical()).toBe("https://app.tastemakersapp.com/");
  });

  it("builds absolute URLs for ordinary paths", () => {
    expect(canonical("/lists")).toBe("https://app.tastemakersapp.com/lists");
    expect(canonical("/restaurants/langer-s-159")).toBe(
      "https://app.tastemakersapp.com/restaurants/langer-s-159",
    );
  });

  it("tolerates a missing leading slash rather than emitting a broken URL", () => {
    // Guards against `canonical(`restaurants/${slug}`)` silently producing
    // "https://app.tastemakersapp.comrestaurants/x".
    expect(canonical("restaurants/x-1")).toBe("https://app.tastemakersapp.com/restaurants/x-1");
  });

  it("strips a trailing slash so /lists and /lists/ cannot both claim canonical", () => {
    expect(canonical("/lists/")).toBe(canonical("/lists"));
  });

  it("never emits a double slash between origin and path", () => {
    for (const p of ["/", "", "/lists", "lists", "/lists/"]) {
      expect(canonical(p)).not.toMatch(/[^:]\/\//);
    }
  });
});

describe("CANONICAL_ORIGIN", () => {
  it("defaults to the production domain when nothing is configured", async () => {
    const m = await importWithEnv({ NEXT_PUBLIC_CANONICAL_ORIGIN: "" });
    expect(m.CANONICAL_ORIGIN).toBe("https://app.tastemakersapp.com");
  });

  it("moves the whole site to a new domain from one variable", async () => {
    // The domain merge this exists for: www becomes canonical, app. redirects.
    const m = await importWithEnv({
      NEXT_PUBLIC_CANONICAL_ORIGIN: "https://www.tastemakersapp.com",
    });
    expect(m.CANONICAL_ORIGIN).toBe("https://www.tastemakersapp.com");
    expect(m.canonical("/restaurants")).toBe("https://www.tastemakersapp.com/restaurants");
    expect(m.canonical("/")).toBe("https://www.tastemakersapp.com/");
  });

  it("strips trailing slashes off the configured value", async () => {
    const m = await importWithEnv({
      NEXT_PUBLIC_CANONICAL_ORIGIN: "https://www.tastemakersapp.com///",
    });
    expect(m.canonical("/lists")).toBe("https://www.tastemakersapp.com/lists");
  });

  it("ignores a whitespace-only value instead of producing an empty origin", async () => {
    const m = await importWithEnv({ NEXT_PUBLIC_CANONICAL_ORIGIN: "   " });
    expect(m.CANONICAL_ORIGIN).toBe("https://app.tastemakersapp.com");
  });

  it("does NOT read NEXT_PUBLIC_SITE_URL", async () => {
    // The regression this prevents: NEXT_PUBLIC_SITE_URL is http://localhost:3050
    // in .env.local because OAuth callbacks must return to the local machine.
    // If canonicals ever derived from it, a local `next build` would publish
    // localhost canonicals and a localhost sitemap.
    const m = await importWithEnv({
      NEXT_PUBLIC_SITE_URL: "http://localhost:3050",
      NEXT_PUBLIC_CANONICAL_ORIGIN: "",
    });
    expect(m.CANONICAL_ORIGIN).toBe("https://app.tastemakersapp.com");
    expect(m.canonical("/lists")).not.toContain("localhost");
  });
});
