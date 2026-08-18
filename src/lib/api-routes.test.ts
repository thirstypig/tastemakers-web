import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import nextConfig from "../../next.config";

/**
 * This app has NO /api proxy. It does not call the Laravel API — every data
 * path goes to Supabase directly (TODO-089), and every `/api/*` URL the client
 * fetches must be a Next.js route handler in `src/app/api`.
 *
 * next.config.ts used to carry a fallback rewrite to `http://localhost:4050`.
 * That host does not exist in production, so any unmatched `/api/*` request
 * returned **500 Internal Server Error** rather than a 404 — dev config that
 * shipped. The proxy is gone; these tests stop it coming back by accident, and
 * stop a fetch being added for a path that nothing serves.
 */

const SRC = resolve(__dirname, "..");
const ROOT = resolve(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "node_modules") walk(full, out);
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Every `/api/...` literal passed to fetch(), normalised to a route pattern. */
function fetchedApiPaths(): Array<{ file: string; path: string }> {
  const found: Array<{ file: string; path: string }> = [];
  for (const file of walk(SRC)) {
    const src = readFileSync(file, "utf8");
    // fetch("/api/x"), fetch('/api/x'), fetch(`/api/${id}/y`)
    for (const m of src.matchAll(/fetch\(\s*[`'"](\/api\/[^`'"]*)[`'"]/g)) {
      const raw = m[1]!
        .split("?")[0]!                    // drop query strings
        .replace(/\$\{[^}]*\}/g, "[id]");  // template holes are dynamic segments
      found.push({ file: file.replace(ROOT + "/", ""), path: raw });
    }
  }
  return found;
}

/** Route handlers that actually exist, as patterns like /api/restaurants/[id]/tag */
function handlerRoutes(): string[] {
  const base = join(SRC, "app", "api");
  return walk(base)
    .filter((f) => f.endsWith("route.ts") || f.endsWith("route.tsx"))
    .map((f) =>
      f.replace(join(SRC, "app"), "").replace(/\/route\.tsx?$/, ""),
    );
}

/** A fetched path matches a handler if segments line up, treating [x] as a wildcard. */
function isServed(path: string, routes: string[]): boolean {
  const want = path.split("/").filter(Boolean);
  return routes.some((route) => {
    const have = route.split("/").filter(Boolean);
    if (have.length !== want.length) return false;
    return have.every((seg, i) => seg.startsWith("[") || seg === want[i]);
  });
}

/**
 * The legacy iOS compatibility contract.
 *
 * Same class of object as EXTERNALLY_REFERENCED in redirects.test.ts: a URL
 * this codebase does not control, burned into a SHIPPED App Store binary that
 * old versions keep asking for long after a new build ships. Changing either
 * half breaks clients that cannot be patched. Removal is gated on TASK-24.
 */
const LEGACY_IOS_SHIM = {
  source: "/v2/api/:path*",
  destination: "https://api.tastemakersapp.com/api/:path*",
} as const;

type Rule = { source: string; destination: string };

/** Rewrites as the config actually returns them, in either supported shape. */
async function rewriteRules(): Promise<Rule[]> {
  const r = await nextConfig.rewrites!();
  return Array.isArray(r)
    ? r
    : [...(r.beforeFiles ?? []), ...(r.afterFiles ?? []), ...(r.fallback ?? [])];
}

async function redirectRules(): Promise<Rule[]> {
  return (await nextConfig.redirects!()) as Rule[];
}

/** Does a Next path pattern match this concrete URL? */
function captures(pattern: string, url: string): boolean {
  const re = new RegExp(
    "^" +
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/:\w+\*/g, ".*")
        .replace(/:\w+/g, "[^/]+") +
      "$",
  );
  return re.test(url);
}

describe("/api routes", () => {
  it("finds the route handlers and the fetch call sites", () => {
    // Guards the guard: if the scanners silently return nothing, every
    // assertion below passes vacuously.
    expect(handlerRoutes().length).toBeGreaterThan(0);
    expect(fetchedApiPaths().length).toBeGreaterThan(0);
  });

  it("serves every /api path the client fetches", () => {
    const routes = handlerRoutes();
    const orphans = fetchedApiPaths().filter((f) => !isServed(f.path, routes));
    expect(
      orphans,
      `No route handler for: ${orphans.map((o) => `${o.path} (${o.file})`).join(", ")}. ` +
        `There is no Laravel proxy to fall through to — an unmatched /api path 404s.`,
    ).toEqual([]);
  });

  it("parses the rewrite and redirect tables", async () => {
    // Guards the guard. Every assertion below filters a list; if the list comes
    // back empty because the config stopped exporting these, they all pass
    // vacuously. redirects.test.ts uses the same pattern.
    expect((await rewriteRules()).length).toBeGreaterThan(0);
    expect((await redirectRules()).length).toBeGreaterThan(0);
  });

  it("never proxies this app's own /api namespace", async () => {
    // The original bug was a fallback rewrite of /api/:path* to
    // http://localhost:4050 — the dev port, shipped to production, where it
    // returned 500 rather than 404 for every unmatched path (SOL-006).
    //
    // This asserts the BUG is absent, not that rewrites are. The narrow rewrite
    // of the dead legacy prefix below is deliberate and must stay allowed; a
    // catch-all over /api must not come back.
    const rules = await rewriteRules();

    const proxiesOwnApi = rules
      .map((r) => r.source)
      .filter((src) => /^\/api(\/|$)/.test(src));
    expect(
      proxiesOwnApi,
      `next.config rewrites ${proxiesOwnApi.join(", ")}. This app's /api/* routes are ` +
        `served by src/app/api and must not be proxied — a fallback there turns an ` +
        `unmatched path into a 500 instead of a 404.`,
    ).toEqual([]);

    // Any dev host, not just the one that shipped: 127.0.0.1 and 0.0.0.0 are
    // the same bug wearing a different spelling, and port 3050 is as wrong as
    // 4050. Only builds are checked — `npm run dev` deliberately points the
    // shim at a local Laravel so it cannot write to the production database.
    const devHosts = rules
      .filter((r) => /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(r.destination))
      .map((r) => `${r.source} -> ${r.destination}`);
    expect(
      devHosts,
      `next.config points ${devHosts.join(", ")} at a dev host. In production that ` +
        `returns 500, not 404, so it reads as a server fault rather than a missing route.`,
    ).toEqual([]);
  });

  it("keeps the legacy /v2/api shim the shipped iOS build depends on", async () => {
    // NetworkManager.swift:14 builds every request from
    // https://tastemakersapp.com/v2/api/ — the old Namecheap layout. Removing
    // this rewrite re-breaks every API call from App Store versions already
    // installed, which cannot be fixed by shipping a new build.
    //
    // Asserted against the EXECUTED config, not the file text: a commented-out
    // block, a template-literal source or an env-conditional `return []` all
    // leave the right characters in the file while shipping nothing.
    const shim = (await rewriteRules()).find((r) => r.source === LEGACY_IOS_SHIM.source);
    expect(shim, `no rewrite for ${LEGACY_IOS_SHIM.source} — the shipped iOS build 404s`).toBeDefined();
    expect(shim!.destination).toBe(LEGACY_IOS_SHIM.destination);
  });

  it("lets no redirect capture the legacy shim prefix", async () => {
    // Redirects run BEFORE rewrites, so one matching /v2/api wins over the
    // shim. URLSession downgrades a 301 on a POST to GET, so login, signup and
    // every write from the installed base would break while the redirect still
    // looked like a healthy 3xx in logs — and the shim guard above would still
    // pass. The likely candidate is an apex -> www canonicalisation.
    const capturing = (await redirectRules())
      .filter((r) => captures(r.source, "/v2/api/login"))
      .map((r) => `${r.source} -> ${r.destination}`);
    expect(
      capturing,
      `next.config redirects ${capturing.join(", ")}, which swallows the legacy iOS ` +
        `shim prefix. Exempt /v2/api explicitly before adding a redirect this broad.`,
    ).toEqual([]);
  });
});
