import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * The redirect table in `next.config.ts` is the only thing keeping a set of
 * URLs alive that this codebase does not control:
 *
 *   /privacy-policy, /review-tag, /about-us   hardcoded in the SHIPPED iOS
 *                                             build (Constant.swift) and in
 *                                             links on the old marketing site
 *   /tech, /status, /roadmap, /changelog,     short vanity URLs that predate
 *   /analytics                                the /admin/* move
 *
 * Deleting a row silently 404s an address someone else still points at, and
 * nothing else in the suite would notice.
 *
 * The sharper risk is a redirect aimed at a page that later stops existing.
 * `/review-tag -> /review` is the live example: `(site)/review` is an orphaned
 * v1-design page with no inbound nav, i.e. exactly the kind of thing a future
 * cleanup deletes. That would leave a redirect pointing into a 404 — a worse
 * failure than the original 404, because it looks deliberate.
 */

const ROOT = resolve(__dirname, "../..");
const APP = resolve(__dirname, "../app");

/** Redirect rows parsed straight out of the config source. */
function redirectTable(): Array<{ source: string; destination: string; permanent: boolean }> {
  const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf8");
  const body = cfg.slice(cfg.indexOf("async redirects"));
  return [...body.matchAll(
    /\{\s*source:\s*"([^"]+)"\s*,\s*destination:\s*"([^"]+)"\s*,\s*permanent:\s*(true|false)\s*\}/g,
  )].map((m) => ({ source: m[1]!, destination: m[2]!, permanent: m[3] === "true" }));
}

/**
 * Every URL this app actually serves.
 *
 * Route groups — the `(app)` / `(public)` / `(site)` parentheses directories —
 * organise files without appearing in the URL, so they are stripped. Dynamic
 * segments stay as `[slug]` and are matched as wildcards.
 */
function realRoutes(): string[] {
  const out: string[] = [];
  (function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "page.tsx" || entry === "page.ts") {
        const url = dir
          .replace(APP, "")
          .split("/")
          .filter((seg) => seg && !/^\(.*\)$/.test(seg))
          .join("/");
        out.push("/" + url);
      }
    }
  })(APP);
  return out.map((r) => (r === "/" ? "/" : r.replace(/\/+$/, "")));
}

function resolvesToPage(url: string, routes: string[]): boolean {
  const want = url.split("/").filter(Boolean);
  return routes.some((route) => {
    const have = route.split("/").filter(Boolean);
    if (have.length !== want.length) return false;
    return have.every((seg, i) => seg.startsWith("[") || seg === want[i]);
  });
}

// URLs owned by external consumers. Removing one breaks somebody else's link.
const EXTERNALLY_REFERENCED = [
  "/privacy-policy",
  "/review-tag",
  "/about-us",
];

describe("next.config redirects", () => {
  it("parses the redirect table and the route tree", () => {
    // Guards the guard: silent parse failure would make everything below vacuous.
    expect(redirectTable().length).toBeGreaterThan(0);
    expect(realRoutes().length).toBeGreaterThan(0);
    expect(realRoutes()).toContain("/");
  });

  it("points every redirect at a page that exists", () => {
    const routes = realRoutes();
    const broken = redirectTable().filter((r) => !resolvesToPage(r.destination, routes));
    expect(
      broken,
      `Redirect destination has no page: ${broken.map((b) => `${b.source} -> ${b.destination}`).join(", ")}. ` +
        `A redirect into a 404 is worse than the original 404 — it looks intentional.`,
    ).toEqual([]);
  });

  it("keeps the redirects that external consumers depend on", () => {
    const sources = redirectTable().map((r) => r.source);
    for (const url of EXTERNALLY_REFERENCED) {
      expect(
        sources,
        `${url} is hardcoded in the shipped iOS build and/or old marketing links. ` +
          `Old App Store versions stay installed for months and ask for it literally.`,
      ).toContain(url);
    }
  });

  it("never shadows a real page with a redirect", () => {
    // Redirects run BEFORE routing, so a redirect whose source is also a real
    // route makes that page permanently unreachable.
    const routes = realRoutes();
    const shadowed = redirectTable().filter((r) => resolvesToPage(r.source, routes));
    expect(
      shadowed,
      `Redirect source collides with a real page: ${shadowed.map((s) => s.source).join(", ")}. ` +
        `Redirects run before routing, so that page can never render.`,
    ).toEqual([]);
  });

  it("never redirects a path to itself", () => {
    const loops = redirectTable().filter((r) => r.source === r.destination);
    expect(loops, `Self-redirect loops: ${loops.map((l) => l.source).join(", ")}`).toEqual([]);
  });

  it("marks legacy redirects permanent so link equity transfers", () => {
    const table = redirectTable();
    const temporary = table
      .filter((r) => EXTERNALLY_REFERENCED.includes(r.source))
      .filter((r) => !r.permanent);
    expect(
      temporary,
      `These should be permanent (308) so search engines transfer ranking: ` +
        temporary.map((t) => t.source).join(", "),
    ).toEqual([]);
  });
});
