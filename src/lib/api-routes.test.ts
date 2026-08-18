import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

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

  it("declares no proxy rewrite in next.config", () => {
    const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf8");
    // Strip comments — the config explains the removed proxy in prose.
    const code = cfg.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toMatch(/async\s+rewrites\s*\(/);
    expect(code).not.toContain("localhost:4050");
  });
});
