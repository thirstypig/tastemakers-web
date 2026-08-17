import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the failure mode that splitting globals.css into feature stylesheets
 * introduced five separate times: markup using a `tm-*` class whose rule
 * either does not exist, or lives in a stylesheet nothing imports.
 *
 * Neither `tsc` nor the build catches this — CSS classes are strings, not
 * imports — and the page renders unstyled rather than erroring, so it only
 * shows up if a human looks at that exact screen at that exact width.
 */

const SRC = join(process.cwd(), "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const files = walk(SRC);
const cssFiles = files.filter((f) => f.endsWith(".css"));
const codeFiles = files.filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx"));

/** Class names any stylesheet defines. */
const definedClasses = new Set<string>();
for (const f of cssFiles) {
  const css = readFileSync(f, "utf8");
  for (const m of css.matchAll(/\.(tm-[A-Za-z0-9_-]+)/g)) {
    definedClasses.add(m[1]!);
  }
}

/** Class names the markup actually uses, with where they came from. */
const usedClasses = new Map<string, string>();
for (const f of codeFiles) {
  const code = readFileSync(f, "utf8");
  // className="..." and className={`...`} — the literal parts are enough.
  for (const m of code.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const value = m[1] ?? m[2] ?? "";
    for (const cls of value.split(/[\s${}]+/)) {
      if (cls.startsWith("tm-") && !usedClasses.has(cls)) {
        usedClasses.set(cls, f.replace(`${SRC}/`, ""));
      }
    }
  }
}

describe("CSS wiring", () => {
  it("defines every tm-* class the markup uses", () => {
    const orphans = [...usedClasses.entries()]
      .filter(([cls]) => !definedClasses.has(cls))
      .map(([cls, where]) => `${cls} (used in ${where})`);

    expect(orphans).toEqual([]);
  });

  it("imports every stylesheet under src/", () => {
    const allCode = codeFiles.map((f) => readFileSync(f, "utf8")).join("\n");

    const unimported = cssFiles
      .map((f) => f.replace(`${SRC}/`, ""))
      // globals.css and tokens.css are wired through the root layout by path.
      .filter((rel) => !allCode.includes(rel.split("/").pop()!));

    expect(unimported).toEqual([]);
  });

  it("found a meaningful number of classes (guards against a broken scan)", () => {
    // If the regexes stop matching, both checks above pass vacuously.
    expect(usedClasses.size).toBeGreaterThan(40);
    expect(definedClasses.size).toBeGreaterThan(40);
  });
});
