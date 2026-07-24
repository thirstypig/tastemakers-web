import { describe, it, expect } from "vitest";
import {
  computeCostRows, parseFrontmatter, buildStatusBlock, replaceMarkerBlock,
  collectRoadmapState, isVendored,
} from "./refresh-docs.mjs";

/**
 * The regression this guards: counting the committed Metronic admin theme as project
 * code inflated published LOC ~10x (510k vs ~81k of real application source).
 */
describe("isVendored", () => {
  it("excludes the committed admin theme assets", () => {
    expect(isVendored("public/assets/js/pages/crud/forms/widgets/select2.js")).toBe(true);
    expect(isVendored("assets/css/style.bundle.css")).toBe(true);
  });

  it("excludes minified files anywhere", () => {
    expect(isVendored("resources/js/app.min.js")).toBe(true);
    expect(isVendored("css/theme.min.css")).toBe(true);
  });

  it("excludes vendor, Pods, node_modules, dist and build trees", () => {
    for (const p of ["vendor/laravel/framework/x.php", "Pods/Alamofire/Source/x.swift",
                     "node_modules/react/index.js", "dist/main.js", "build/out.css"]) {
      expect(isVendored(p), p).toBe(true);
    }
  });

  it("excludes the archived backup and test-report trees", () => {
    expect(isVendored("old_Laravel_Backup/app/Http/Controllers/X.php")).toBe(true);
    expect(isVendored("playwright-report/data/abc.md")).toBe(true);
  });

  it("does NOT exclude real application source", () => {
    for (const p of ["app/Http/Controllers/RestaurantController.php", "src/lib/docs.ts",
                     "src/app/admin/docs/page.tsx", "scripts/refresh-docs.mjs",
                     "Tastemaker/ViewControllers/LoginViewController.swift"]) {
      expect(isVendored(p), p).toBe(false);
    }
  });

  it("does not mistake a filename containing 'assets' for the assets directory", () => {
    expect(isVendored("src/lib/asset-helpers.ts")).toBe(false);
  });
});

/**
 * costs.md is the artifact presented to outside parties. These numbers were verified by
 * hand once; without a test that verification does not survive the next edit.
 */
describe("computeCostRows", () => {
  const cfg = {
    assumptions: { unitsPerUserPerMonth: 10, planPriceUsd: 5 },
    unitCosts: {
      primaryVariablePerUnit: 0.02, perUserMonthAuth: 0.01, perUserMonthDb: 0.05,
      hostingFlatMonth: 20, paymentPctFee: 0.029, paymentFlatFee: 0.3,
    },
    tiers: [10, 100, 1000],
  };

  it("computes the 100-user tier exactly (hand-checked)", () => {
    const r = computeCostRows(cfg)[1];
    // 10 × 0.02 + 0.01 + 0.05 = 0.26
    expect(r.varPerUser).toBeCloseTo(0.26, 10);
    expect(r.totalVar).toBeCloseTo(26, 10);
    expect(r.hostingPerUser).toBeCloseTo(0.2, 10);   // 20 / 100
    // 100 × (5 × 0.029 + 0.30) = 44.50
    expect(r.fees).toBeCloseTo(44.5, 10);
    expect(r.revenue).toBeCloseTo(500, 10);
    expect(r.cost).toBeCloseTo(90.5, 10);            // 26 + 20 + 44.50
    expect(r.margin).toBeCloseTo(409.5, 10);
    expect(r.marginPct).toBeCloseTo(0.819, 4);
  });

  it("spreads fixed hosting thinner as users grow", () => {
    const [a, b, c] = computeCostRows(cfg);
    expect(a.hostingPerUser).toBeCloseTo(2, 10);     // 20 / 10
    expect(b.hostingPerUser).toBeCloseTo(0.2, 10);
    expect(c.hostingPerUser).toBeCloseTo(0.02, 10);
  });

  it("keeps variable cost per user flat across tiers", () => {
    const rows = computeCostRows(cfg);
    expect(new Set(rows.map((r) => r.varPerUser)).size).toBe(1);
  });

  it("margin improves with scale when there is revenue", () => {
    const rows = computeCostRows(cfg);
    expect(rows[2].marginPct).toBeGreaterThan(rows[0].marginPct);
  });

  // Tastemakers has no pricing model — this is the config's real state today.
  it("charges no payment fees and reports 0% margin when there is no plan price", () => {
    const free = { ...cfg, assumptions: { ...cfg.assumptions, planPriceUsd: 0 } };
    for (const r of computeCostRows(free)) {
      expect(r.fees).toBe(0);          // not NaN, not a flat fee per user
      expect(r.revenue).toBe(0);
      expect(r.marginPct).toBe(0);     // guards a divide-by-zero producing NaN/Infinity
      expect(Number.isFinite(r.margin)).toBe(true);
    }
  });

  it("does not divide by zero on a 0-user tier", () => {
    const r = computeCostRows({ ...cfg, tiers: [0] })[0];
    expect(r.hostingPerUser).toBe(0);
    expect(Number.isFinite(r.cost)).toBe(true);
  });

  it("returns one row per configured tier, in order", () => {
    expect(computeCostRows(cfg).map((r) => r.users)).toEqual([10, 100, 1000]);
  });
});

describe("parseFrontmatter", () => {
  it("parses scalars and arrays", () => {
    const fm = parseFrontmatter("---\nid: DOC-013\ntype: stats\ntags: [infra, web]\n---\n# x");
    expect(fm.id).toBe("DOC-013");
    expect(fm.type).toBe("stats");
    expect(fm.tags).toEqual(["infra", "web"]);
  });

  it("strips quotes from array items so legacy solutions docs parse", () => {
    expect(parseFrontmatter('---\ntype: solution\ntags: ["nextjs", "railway"]\n---\n').tags)
      .toEqual(["nextjs", "railway"]);
  });

  it("returns null when there is no frontmatter (doc is then uncounted, not crashed)", () => {
    expect(parseFrontmatter("# No frontmatter here")).toBeNull();
  });

  it("returns null on an unterminated block instead of throwing", () => {
    expect(parseFrontmatter("---\nid: X\nnever closed")).toBeNull();
  });

  it("treats `null` and empty values as absent", () => {
    const fm = parseFrontmatter("---\ntype: prd\nphase: null\nowner:\n---\n");
    expect(fm.phase).toBeNull();
    expect(fm.owner).toBeNull();
  });
});

describe("buildStatusBlock", () => {
  const road = {
    now: [{ id: "RM-01", title: "Finish the hosting migration" }],
    next: [], done: [],
    openTasks: [
      { id: "TASK-01", title: "Fix the constraint", priority: "p1" },
      { id: "TASK-02", title: "Ownership check", priority: "p1" },
      { id: "TASK-03", title: "Auth the delete path", priority: "p1" },
      { id: "TASK-04", title: "Should not appear", priority: "p3" },
    ],
  };

  it("emits both markers so the block can be replaced next run", () => {
    const b = buildStatusBlock(road, "2026-07-24");
    expect(b).toContain("<!-- DOCS:STATUS:START -->");
    expect(b).toContain("<!-- DOCS:STATUS:END -->");
  });

  it("shows exactly the next 3 to-dos", () => {
    const b = buildStatusBlock(road, "2026-07-24");
    expect(b).toContain("TASK-01");
    expect(b).toContain("TASK-03");
    expect(b).not.toContain("TASK-04");
  });

  it("names what is in progress and links the roadmap", () => {
    const b = buildStatusBlock(road, "2026-07-24");
    expect(b).toContain("RM-01");
    expect(b).toContain("docs/product/roadmap.md");
  });

  it("degrades gracefully with nothing in flight", () => {
    const b = buildStatusBlock({ now: [], next: [], done: [], openTasks: [] }, "2026-07-24");
    expect(b).toContain("No open to-dos");
    expect(b).toContain("<!-- DOCS:STATUS:END -->");
  });
});

/**
 * The regression this guards: a non-idempotent replace appends instead of replacing,
 * corrupting CLAUDE.md a little more on every `npm run docs:refresh`.
 */
describe("replaceMarkerBlock", () => {
  const START = "<!-- DOCS:STATUS:START -->";
  const END = "<!-- DOCS:STATUS:END -->";
  const doc = `# Title\n\nintro\n\n${START}\nOLD\n${END}\n\ntail\n`;
  const block = `${START}\nNEW\n${END}`;

  it("replaces the block contents", () => {
    const out = replaceMarkerBlock(doc, block);
    expect(out).toContain("NEW");
    expect(out).not.toContain("OLD");
  });

  it("preserves content before and after the markers", () => {
    const out = replaceMarkerBlock(doc, block);
    expect(out.startsWith("# Title\n\nintro\n\n")).toBe(true);
    expect(out.endsWith("\n\ntail\n")).toBe(true);
  });

  it("is idempotent — running twice does not duplicate the markers", () => {
    const once = replaceMarkerBlock(doc, block);
    const twice = replaceMarkerBlock(once, block);
    expect(twice).toBe(once);
    expect(twice.split(START).length - 1).toBe(1);
    expect(twice.split(END).length - 1).toBe(1);
  });

  it("returns null when markers are missing, so the caller can report it", () => {
    expect(replaceMarkerBlock("# No markers here", block)).toBeNull();
  });

  it("returns null when markers are out of order rather than producing garbage", () => {
    expect(replaceMarkerBlock(`${END}\nx\n${START}`, block)).toBeNull();
  });
});

/**
 * Integration-ish: parses the REAL roadmap.md / todos.md. The regression is silent —
 * reformat those tables and the status block empties with no error anywhere.
 */
describe("collectRoadmapState (against the real docs)", () => {
  it("still parses roadmap and to-do tables after any reformat", async () => {
    const road = await collectRoadmapState();
    expect(road.now.length).toBeGreaterThan(0);
    expect(road.openTasks.length).toBeGreaterThan(0);
    expect(road.now[0].id).toMatch(/^RM-\d+$/);
    expect(road.openTasks[0].id).toMatch(/^TASK-\d+$/);
    expect(road.openTasks[0].priority).toMatch(/^p[123]$/);
  });
});
