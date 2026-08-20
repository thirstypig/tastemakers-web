import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_THEME, THEMED_ROLES } from "./admin-theme";

/**
 * Guards the failure mode that produced this module.
 *
 * Four admin pages each declared their own `const t = {...}`. Three had been
 * migrated to `var(--tm-*)`; `admin/api` still carried the original hardcoded
 * palette. A hex string is as valid as a var reference, so nothing failed —
 * `tsc` passed, the build passed, the page rendered. It simply ignored the ⊙
 * light/dark toggle in the admin header while every other page obeyed it, and
 * the only way to notice was to open that exact page and flip the theme.
 *
 * This is a legitimate source-level assertion rather than a behavioural one:
 * "a themed role is never a colour literal" is invariant across every
 * execution, and no runtime check could see it — the toggle is CSS.
 */

const ADMIN_DIR = join(process.cwd(), "src", "app", "admin");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const adminSources = walk(ADMIN_DIR).filter(
  (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f),
);

describe("ADMIN_THEME", () => {
  it("maps every themed role to a CSS variable, never a literal", () => {
    for (const role of THEMED_ROLES) {
      const value = ADMIN_THEME[role];
      expect(value, `${role} must follow the theme`).toMatch(/^var\(--tm-[a-z-]+\)$/);
    }
  });

  it("keeps data-viz colours as literals, which is the documented exception", () => {
    // A green bar means "healthy" on either background. If these ever become
    // variables the charts lose their meaning, so assert the intent explicitly
    // rather than leaving the next reader to guess it was an oversight.
    expect(ADMIN_THEME.green).toBe("#34d399");
    expect(ADMIN_THEME.red).toBe("#f87171");
    expect(THEMED_ROLES).not.toContain("green");
    expect(THEMED_ROLES).not.toContain("red");
  });

  it("uses the JetBrains Mono variable, not a system font stack", () => {
    // admin/api had shipped `-apple-system, BlinkMacSystemFont, ...`, so it
    // rendered in the wrong typeface as well as the wrong palette.
    expect(ADMIN_THEME.font).toContain("--font-jetbrains-mono");
    expect(ADMIN_THEME.mono).toContain("--font-jetbrains-mono");
  });
});

describe("admin pages", () => {
  it("declare no local theme object", () => {
    // The duplication itself (todo 034): four copies meant a brand change was
    // four edits, and the fourth is the one that got missed.
    const offenders = adminSources.filter((f) => /const t = \{/.test(readFileSync(f, "utf8")));

    expect(offenders.map((f) => f.replace(process.cwd(), ""))).toEqual([]);
  });

  it("assign no colour literal to a themed role", () => {
    // The actual bug, stated directly: `bg: "#0f0f23"` and `text: "#e2e8f0"`.
    const rolePattern = new RegExp(`\\b(${THEMED_ROLES.join("|")})\\s*:\\s*["']#[0-9a-fA-F]{3,8}["']`);

    const offenders = adminSources
      .map((f) => ({ file: f.replace(process.cwd(), ""), hit: readFileSync(f, "utf8").match(rolePattern) }))
      .filter((r) => r.hit)
      .map((r) => `${r.file}: ${r.hit![0]}`);

    expect(offenders).toEqual([]);
  });

  it("assign none of the original dark palette to a colour property", () => {
    // These five are the palette admin/api shipped with. Matching on a
    // *colour-valued property* rather than a bare substring is deliberate:
    // the changelog page quotes "#0f0f23" in prose describing this very fix,
    // and a substring match flags that as a defect. (That changelog line also
    // claims the toggle "applies consistently across all admin pages" — it did
    // not, which is what this guard exists to stop happening silently.)
    const ORIGINAL_DARK = ["#0f0f23", "#16162a", "#2a2a4a", "#e2e8f0", "#94a3b8"];
    const colourProp = /\b(\w*[Cc]olor|bg|background\w*|fill|stroke)\s*:\s*["'](#[0-9a-fA-F]{3,8})["']/g;

    /**
     * `/admin/tech` renders Mermaid through a fixed dark palette in BOTH admin
     * themes — `MERMAID_DARK` in that file, with the wrapper matched to it.
     *
     * That is now a **decision, not a defect** (todo 129, resolved as Option B
     * on 2026-08-20). It previously mixed `theme: "dark"` with three themed
     * vars and came out half-switched in light mode: dark node fills carrying
     * light text. Committing it to dark is deliberate; making Mermaid follow
     * the toggle needs the resolved custom properties read after mount and a
     * re-render on every change, which is real work for an admin-only page.
     *
     * Exempted by name rather than by weakening the rule for every page. If
     * Mermaid is ever made theme-aware, delete this entry in the same commit.
     */
    const EXEMPT = ["/src/app/admin/tech/page.tsx"];

    const offenders = adminSources
      .filter((f) => !EXEMPT.some((e) => f.endsWith(e.split("/").join(sep))))
      .flatMap((f) => {
        const src = readFileSync(f, "utf8");
        return [...src.matchAll(colourProp)]
          .filter((m) => ORIGINAL_DARK.includes(m[2]))
          .map((m) => `${f.replace(process.cwd(), "")}: ${m[0]}`);
      });

    expect(offenders).toEqual([]);
  });
});
