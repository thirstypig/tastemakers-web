#!/usr/bin/env node
/**
 * refresh-docs.mjs — regenerate the LIVING docs from real data.
 *
 * Run:  npm run docs:refresh
 *
 * Writes:
 *   docs/under-the-hood/stats.md          repo + doc metrics
 *   docs/under-the-hood/costs.md          unit economics from docs/costs.config.json
 *   docs/under-the-hood/system-status.md  env-key configuration (never values)
 *   README.md + CLAUDE.md                 status block between DOCS:STATUS markers
 *
 * Run it before every push. What the board shows should be what is true.
 *
 * NOTE ON SCOPE: stats walk the five sibling repos (../tastemakers-*). That works
 * on a dev machine and not on Railway, where only this repo is checked out. Missing
 * repos are reported as unavailable rather than crashing the run.
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MONOREPO = path.resolve(ROOT, "..");
const DOCS = path.join(ROOT, "docs");
const UTH = path.join(DOCS, "under-the-hood");

const REPOS = [
  "tastemakers-backend",
  "tastemakers-web",
  "tastemakers-ios",
  "tastemakers-android",
  "tastemakers-marketing",
];

/** Extensions we count as source. Everything else is grouped as "other". */
const CODE_EXT = {
  ".php": "PHP",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".mjs": "JavaScript",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".md": "Markdown",
  ".css": "CSS",
  ".html": "HTML",
  ".json": "JSON",
};

/** External services and the env key that switches each on. Values are NEVER read. */
const SERVICE_KEYS = [
  { service: "Supabase (database)", key: "DB_PASSWORD", where: "backend" },
  { service: "Supabase (web client)", key: "NEXT_PUBLIC_SUPABASE_URL", where: "web" },
  { service: "Supabase (web server)", key: "SUPABASE_URL", where: "web" },
  { service: "Admin allowlist", key: "ADMIN_EMAILS", where: "web" },
  { service: "Foursquare", key: "FOURSQUARE_API_KEY", where: "backend" },
  { service: "Google OAuth", key: "GOOGLE_CLIENT_ID", where: "backend" },
  { service: "Google Places", key: "GOOGLE_PLACES_API_KEY", where: "backend" },
  { service: "Anthropic (Claude Haiku)", key: "ANTHROPIC_API_KEY", where: "backend" },
  { service: "Voyage AI (embeddings)", key: "VOYAGE_API_KEY", where: "backend" },
  { service: "Firebase FCM (push)", key: "FCM_SERVER_KEY", where: "backend" },
  { service: "Passport signing key", key: "PASSPORT_PRIVATE_KEY", where: "backend" },
  { service: "PostHog", key: "NEXT_PUBLIC_POSTHOG_KEY", where: "web" },
  { section: "GitHub (admin docs)", service: "GitHub token", key: "GITHUB_TOKEN", where: "web" },
];

/**
 * Third-party assets committed into the repos — chiefly the Metronic admin theme under
 * tastemakers-backend/public/assets (228 minified files). Counting these as project LOC
 * inflated the figure ~10x (510k vs ~54k of real application source), so they are
 * tallied separately rather than silently included.
 */
const VENDOR_PATTERNS = [
  /(^|\/)assets\//, /(^|\/)vendor\//, /(^|\/)Pods\//, /(^|\/)node_modules\//,
  /(^|\/)old_Laravel_Backup\//, /(^|\/)playwright-report\//, /\.min\.(js|css)$/,
  /(^|\/)dist\//, /(^|\/)build\//,
];

export function isVendored(relPath) {
  return VENDOR_PATTERNS.some((re) => re.test(relPath));
}

const usd = (n) => `$${n.toFixed(2)}`;
const pct = (n) => `${(n * 100).toFixed(1)}%`;

// ── repo stats ───────────────────────────────────────────────────────────────

/** git ls-files inherently respects .gitignore — cheaper and more correct than walking. */
function trackedFiles(repoDir) {
  try {
    const out = execFileSync("git", ["-C", repoDir, "ls-files"], {
      encoding: "utf-8",
      maxBuffer: 32 * 1024 * 1024,
    });
    return out.split("\n").filter(Boolean);
  } catch {
    return null;
  }
}

async function countLines(file) {
  try {
    const buf = await readFile(file, "utf-8");
    return buf.length === 0 ? 0 : buf.split("\n").length;
  } catch {
    return 0;
  }
}

async function collectRepoStats() {
  const repos = [];
  const locByLang = {};

  for (const name of REPOS) {
    const dir = path.join(MONOREPO, name);
    if (!existsSync(dir)) {
      repos.push({ name, available: false });
      continue;
    }
    const files = trackedFiles(dir);
    if (!files) {
      repos.push({ name, available: false });
      continue;
    }

    let loc = 0;
    let vendoredLoc = 0;
    let vendoredFiles = 0;
    const langs = {};
    for (const rel of files) {
      const ext = path.extname(rel).toLowerCase();
      const lang = CODE_EXT[ext];
      if (!lang) continue;
      const n = await countLines(path.join(dir, rel));
      if (isVendored(rel)) {
        vendoredLoc += n;
        vendoredFiles += 1;
        continue;
      }
      loc += n;
      langs[lang] = (langs[lang] ?? 0) + n;
      locByLang[lang] = (locByLang[lang] ?? 0) + n;
    }
    repos.push({
      name, available: true,
      fileCount: files.length - vendoredFiles,
      loc, langs, vendoredLoc, vendoredFiles,
    });
  }
  return { repos, locByLang };
}

// ── route counts ─────────────────────────────────────────────────────────────

async function collectRoutes() {
  const result = { apiPublic: 0, apiAuth: 0, adminWeb: 0, webPages: 0, webApi: 0 };

  const apiFile = path.join(MONOREPO, "tastemakers-backend", "routes", "api.php");
  if (existsSync(apiFile)) {
    const src = await readFile(apiFile, "utf-8");
    // Routes declared inside the auth:api group block vs outside it.
    const groupStart = src.indexOf("'middleware' => ['auth:api']");
    const lines = src.split("\n");
    let depth = 0;
    let inGroup = false;
    lines.forEach((line, i) => {
      const isRoute = /^\s*Route::(get|post|put|patch|delete)\(/.test(line);
      if (groupStart >= 0 && line.includes("'middleware' => ['auth:api']")) {
        inGroup = true;
        depth = 0;
      }
      if (inGroup) {
        depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
        if (isRoute) result.apiAuth++;
        if (depth <= 0 && i > 0 && line.includes("}")) inGroup = false;
      } else if (isRoute) {
        result.apiPublic++;
      }
    });
  }

  const webFile = path.join(MONOREPO, "tastemakers-backend", "routes", "web.php");
  if (existsSync(webFile)) {
    const src = await readFile(webFile, "utf-8");
    result.adminWeb = (src.match(/^\s*Route::/gm) ?? []).length;
  }

  const appDir = path.join(ROOT, "src", "app");
  if (existsSync(appDir)) {
    const walk = async (dir) => {
      for (const e of await readdir(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) await walk(p);
        else if (e.name === "page.tsx") result.webPages++;
        else if (e.name === "route.ts") result.webApi++;
      }
    };
    await walk(appDir);
  }
  return result;
}

// ── doc frontmatter ──────────────────────────────────────────────────────────

/** Minimal parser for the flat `key: value` frontmatter this project uses. */
export function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return null;
  const fm = {};
  for (const line of raw.slice(4, end).split("\n")) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    let [, k, v] = m;
    v = v.trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      // Strip surrounding quotes on items — legacy solutions/ docs use ["a", "b"].
      v = v
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (v === "null" || v === "") v = null;
    else v = v.replace(/^["']|["']$/g, "");
    fm[k] = v;
  }
  return fm;
}

async function collectDocStats() {
  const byType = {};
  const byStatus = {};
  let total = 0;
  let missingFrontmatter = 0;

  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.name === "_templates") continue; // templates are excluded by design
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(p);
        continue;
      }
      if (!e.name.endsWith(".md")) continue;
      total++;
      const fm = parseFrontmatter(await readFile(p, "utf-8"));
      if (!fm?.type) {
        missingFrontmatter++;
        continue;
      }
      byType[fm.type] = (byType[fm.type] ?? 0) + 1;
      if (fm.status) byStatus[fm.status] = (byStatus[fm.status] ?? 0) + 1;
    }
  };
  await walk(DOCS);
  return { total, byType, byStatus, missingFrontmatter };
}

// ── roadmap / todo state ─────────────────────────────────────────────────────

/** Pull `| **RM-01** | Item | ... | `status` |` rows out of the markdown tables. */
export async function collectRoadmapState() {
  const read = async (f) => (existsSync(f) ? await readFile(f, "utf-8") : "");
  const roadmap = await read(path.join(DOCS, "product", "roadmap.md"));
  const todos = await read(path.join(DOCS, "product", "todos.md"));

  const rmRows = [...roadmap.matchAll(/\|\s*\*\*(RM-\d+)\*\*\s*\|\s*([^|]+?)\s*\|[^|]*\|\s*`(\w+)`\s*\|/g)].map(
    (m) => ({ id: m[1], title: m[2].trim(), status: m[3] })
  );
  const taskRows = [...todos.matchAll(/\|\s*\*\*(TASK-\d+)\*\*\s*\|\s*([^|]+?)\s*\|[^|]*\|\s*(\w+)\s*\|\s*`(\w+)`\s*\|/g)].map(
    (m) => ({ id: m[1], title: m[2].trim(), priority: m[3], status: m[4] })
  );

  return {
    now: rmRows.filter((r) => r.status === "now"),
    next: rmRows.filter((r) => r.status === "next"),
    done: rmRows.filter((r) => r.status === "done"),
    openTasks: taskRows.filter((t) => t.status === "open"),
  };
}

// ── writers ──────────────────────────────────────────────────────────────────

function fm(id, type, updated) {
  return [
    "---",
    `id: ${id}`,
    `type: ${type}`,
    "status: active",
    "phase: null",
    "owner: james",
    "tags: []",
    "links: [DOC-001]",
    `updated: ${updated}`,
    "---",
    "",
  ].join("\n");
}

async function writeStats({ repoStats, routes, docStats, road }, today, stamp) {
  const { repos, locByLang } = repoStats;
  const totalLoc = Object.values(locByLang).reduce((a, b) => a + b, 0);
  const totalFiles = repos.reduce((a, r) => a + (r.fileCount ?? 0), 0);
  const vendoredLoc = repos.reduce((a, r) => a + (r.vendoredLoc ?? 0), 0);
  const vendoredFiles = repos.reduce((a, r) => a + (r.vendoredFiles ?? 0), 0);

  const out = [
    fm("DOC-013", "stats", today),
    "# Stats",
    "",
    "> **GENERATED — do not hand-edit.** `npm run docs:refresh`.",
    "",
    "> **On LOC:** lines of code is a rough vanity signal, tracked here for reference only.",
    "> Real progress is features and phases shipped — see the roadmap section below. A big",
    "> number here can just as easily mean duplication (this codebase has a 2,985-line",
    "> controller and one query copy-pasted four times).",
    "",
    "## Where we are",
    "",
    road.now.length
      ? road.now.map((r) => `- **In progress:** ${r.id} — ${r.title}`).join("\n")
      : "- _Nothing marked `now` in the roadmap._",
    "",
    `**Shipped (roadmap items done):** ${road.done.length}`,
    `**Committed next:** ${road.next.length}`,
    `**Open to-dos:** ${road.openTasks.length}`,
    "",
    road.openTasks.length
      ? ["### Next up", "", ...road.openTasks.slice(0, 3).map((t) => `1. **${t.id}** (${t.priority}) — ${t.title}`), ""].join("\n")
      : "",
    "## Code",
    "",
    `**${totalFiles.toLocaleString()} source files · ${totalLoc.toLocaleString()} lines of application code** across ${repos.filter((r) => r.available).length} repos.`,
    "",
    `_Excludes ${vendoredFiles.toLocaleString()} vendored files (${vendoredLoc.toLocaleString()} lines) — chiefly the committed Metronic admin theme in the backend. Counting those inflated the figure roughly 10x._`,
    "",
    "| Repo | Source files | Lines | Vendored (excluded) |",
    "|---|---:|---:|---:|",
    ...repos.map((r) =>
      r.available
        ? `| \`${r.name}\` | ${r.fileCount.toLocaleString()} | ${r.loc.toLocaleString()} | ${(r.vendoredLoc ?? 0).toLocaleString()} |`
        : `| \`${r.name}\` | _not available_ | — | — |`
    ),
    "",
    "### By language",
    "",
    "| Language | Lines |",
    "|---|---:|",
    ...Object.entries(locByLang)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, n]) => `| ${lang} | ${n.toLocaleString()} |`),
    "",
    "## Routes",
    "",
    "| Surface | Count |",
    "|---|---:|",
    `| Backend API — authenticated | ${routes.apiAuth} |`,
    `| Backend API — public | ${routes.apiPublic} |`,
    `| Backend admin (Blade) | ${routes.adminWeb} |`,
    `| Web pages | ${routes.webPages} |`,
    `| Web API handlers | ${routes.webApi} |`,
    "",
    "## Docs",
    "",
    `**${docStats.total} markdown files** in \`docs/\` (templates excluded).`,
    docStats.missingFrontmatter
      ? `\n⚠️ **${docStats.missingFrontmatter} have no frontmatter** — they are invisible to the board. See \`README-DOCS.md\` §8.\n`
      : "\n✅ Every doc has frontmatter.\n",
    "| Type | Count |",
    "|---|---:|",
    ...Object.entries(docStats.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `| \`${t}\` | ${n} |`),
    "",
    "| Status | Count |",
    "|---|---:|",
    ...Object.entries(docStats.byStatus)
      .sort((a, b) => b[1] - a[1])
      .map(([s, n]) => `| \`${s}\` | ${n} |`),
    "",
    `<!-- generated ${stamp} by scripts/refresh-docs.mjs -->`,
    "",
  ];
  await writeFile(path.join(UTH, "stats.md"), out.filter((l) => l !== "").join("\n").replace(/\n{3,}/g, "\n\n"), "utf-8");
}

/**
 * Unit economics per tier. Pure — extracted from writeCosts so it can be tested.
 * costs.md is the artifact shown to outside parties; silently wrong margins here
 * would be worse than no table at all.
 */
export function computeCostRows(cfg) {
  const { assumptions: a, unitCosts: u, tiers } = cfg;
  return tiers.map((users) => {
    const varPerUser = a.unitsPerUserPerMonth * u.primaryVariablePerUnit + u.perUserMonthAuth + u.perUserMonthDb;
    const totalVar = varPerUser * users;
    const hostingPerUser = users > 0 ? u.hostingFlatMonth / users : 0;
    const revenue = users * a.planPriceUsd;
    const fees = a.planPriceUsd > 0 ? users * (a.planPriceUsd * u.paymentPctFee + u.paymentFlatFee) : 0;
    const cost = totalVar + u.hostingFlatMonth + fees;
    const margin = revenue - cost;
    return { users, varPerUser, totalVar, hostingPerUser, fees, revenue, cost, margin,
      marginPct: revenue > 0 ? margin / revenue : 0 };
  });
}

async function writeCosts(cfg, today, stamp) {
  const { assumptions: a, unitCosts: u } = cfg;
  const verify = new Set(cfg._verify ?? []);
  const mark = (k, v) => (verify.has(k) ? `${v} ⚠️ VERIFY` : v);
  const noRevenue = !a.planPriceUsd;
  const rows = computeCostRows(cfg);

  const out = [
    fm("DOC-014", "costs", today),
    "# Costs",
    "",
    "> **GENERATED — do not hand-edit.** Edit `docs/costs.config.json`, then `npm run docs:refresh`.",
    "",
  ];

  if (noRevenue) {
    out.push(
      "## ⚠️ There is no revenue model",
      "",
      "**Tastemakers has no pricing, no payment code, and no plan price.** Verified across all",
      "five repos on 2026-07-23: no Stripe, no StoreKit, no in-app purchase, no checkout.",
      "The only monetization signal is AdSense, and `ADS_ENABLED` is `false` in `src/lib/ads.ts`.",
      "",
      "So every revenue and margin figure below is **$0.00 by definition, not by measurement.**",
      "The cost side is real once the unit costs are filled in; the revenue side is a waiting",
      "template. Set `planPriceUsd` in `costs.config.json` when a price exists.",
      ""
    );
  }

  out.push(
    "## Assumptions",
    "",
    "These drive every number below. Read them before reading the table.",
    "",
    "| Assumption | Value |",
    "|---|---|",
    `| ${a.unitLabel} per user per month | ${mark("unitsPerUserPerMonth", a.unitsPerUserPerMonth)} |`,
    `| Average ${a.unitSizeLabel} | ${mark("avgUnitSize", a.avgUnitSize)} |`,
    `| Plan price (per user / month) | ${mark("planPriceUsd", usd(a.planPriceUsd))} |`,
    "",
    "| Unit cost | Value |",
    "|---|---|",
    `| Primary variable, per ${a.unitLabel.replace(/s$/, "")} | ${mark("primaryVariablePerUnit", usd(u.primaryVariablePerUnit))} |`,
    `| Auth, per user / month | ${mark("perUserMonthAuth", usd(u.perUserMonthAuth))} |`,
    `| Database, per user / month | ${mark("perUserMonthDb", usd(u.perUserMonthDb))} |`,
    `| Hosting, flat / month | ${mark("hostingFlatMonth", usd(u.hostingFlatMonth))} |`,
    `| Payment fee | ${pct(u.paymentPctFee)} + ${usd(u.paymentFlatFee)} |`,
    "",
    "**⚠️ VERIFY** marks a figure nobody has confirmed against an invoice or a measured call.",
    "Treat those rows as placeholders, not estimates.",
    "",
    "## Unit economics by scale",
    "",
    "| Users | Variable / user | Total variable | Hosting / user | Payment fees | Revenue | Total cost | Gross margin | Margin % |",
    "|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...rows.map(
      (r) =>
        `| ${r.users.toLocaleString()} | ${usd(r.varPerUser)} | ${usd(r.totalVar)} | ${usd(r.hostingPerUser)} | ${usd(r.fees)} | ${usd(r.revenue)} | ${usd(r.cost)} | ${usd(r.margin)} | ${r.revenue > 0 ? pct(r.marginPct) : "n/a"} |`
    ),
    "",
    "### What drives these numbers",
    "",
    ...Object.entries(cfg._notes ?? {}).map(([k, v]) => `- **\`${k}\`** — ${v}`),
    "",
    `<!-- generated ${stamp} by scripts/refresh-docs.mjs -->`,
    ""
  );

  await writeFile(path.join(UTH, "costs.md"), out.join("\n"), "utf-8");
}

async function writeSystemStatus(today, stamp) {
  const rows = SERVICE_KEYS.map(({ service, key, where }) => {
    const present = typeof process.env[key] === "string" && process.env[key].length > 0;
    return `| ${service} | \`${key}\` | ${where} | ${present ? "✅ configured" : "⬜ not set here"} |`;
  });

  const out = [
    fm("DOC-015", "status", today),
    "# System status",
    "",
    "> **GENERATED (lite) — do not hand-edit.** `npm run docs:refresh`.",
    "",
    "> **What this does and does not tell you.** It reports whether each service's env key",
    "> is *present in the environment where this script ran* — nothing more. It does not",
    "> call any service, and it **never prints a key's value.** Running locally will show",
    "> production-only keys as not set; that is expected and is not an outage.",
    "",
    "## Configuration",
    "",
    "| Service | Env key | Service | Configured here |",
    "|---|---|---|---|",
    ...rows,
    "",
    "## Deployment",
    "",
    "Platform: **Railway**, project `c6fd4935-ffeb-4cd9-9185-81a941bcb6c7`, GitHub auto-deploy.",
    "",
    "<!-- Last deploy time is not read here: it needs a Railway API token, which this script",
    "     deliberately does not require. Check the Railway dashboard, or wire it in later. -->",
    "",
    "## Known configuration gaps",
    "",
    "- `FOURSQUARE_API_KEY` unset on Railway → `GET /api/restaurants` fails",
    "- `GITHUB_TOKEN` (web service) expires ~2027-06 → admin docs silently stop loading",
    "",
    "---",
    "",
    "<!-- FUTURE: real health checks.",
    "     Dormant until there are paying users — polling costs money and attention, and",
    "     nobody is woken up by these today. When it earns its place, each service gets:",
    "",
    "       | Service | Endpoint | Latency | Uptime 30d | Last checked |",
    "       |---------|----------|---------|------------|--------------|",
    "       | API     | GET /api/health        | 120ms | 99.9% | 2026-07-23T10:00Z |",
    "       | Web     | GET /                  |  80ms | 99.9% | 2026-07-23T10:00Z |",
    "       | DB      | SELECT 1               |  15ms | 100%  | 2026-07-23T10:00Z |",
    "",
    "     Implementation sketch:",
    "       - add a cheap GET /api/health to the Laravel API (no auth, no DB write)",
    "       - probe each service here with a 5s timeout, record latency",
    "       - persist results so uptime is a rolling window, not a single sample",
    "       - src/lib/api-probe.ts already has runCheck() with tests - reuse it",
    "-->",
    "",
    `<!-- generated ${stamp} by scripts/refresh-docs.mjs -->`,
    "",
  ];
  await writeFile(path.join(UTH, "system-status.md"), out.join("\n"), "utf-8");
}

// ── marker block (6d) ────────────────────────────────────────────────────────

const START = "<!-- DOCS:STATUS:START -->";
const END = "<!-- DOCS:STATUS:END -->";

export function buildStatusBlock(road, today) {
  const lines = [
    START,
    "",
    "## Current focus",
    "",
    `_Generated ${today} by \`npm run docs:refresh\` — do not edit between these markers._`,
    "",
    road.now.length
      ? `**Now:** ${road.now.map((r) => `${r.id} ${r.title}`).join(" · ")}`
      : "**Now:** _nothing marked `now`_",
    "",
    "**Next 3 to-dos:**",
    "",
    ...(road.openTasks.length
      ? road.openTasks.slice(0, 3).map((t, i) => `${i + 1}. **${t.id}** (${t.priority}) — ${t.title}`)
      : ["_No open to-dos._"]),
    "",
    "→ Full roadmap: [`docs/product/roadmap.md`](docs/product/roadmap.md)",
    "",
    END,
  ];
  return lines.join("\n");
}

/**
 * Replace everything between the DOCS:STATUS markers. Pure, and MUST be idempotent —
 * a bug here appends instead of replacing and corrupts CLAUDE.md a little on every run.
 * Returns null when the markers are absent or malformed, so callers report rather than
 * guess where the block belongs.
 */
export function replaceMarkerBlock(src, block) {
  const s = src.indexOf(START);
  const e = src.indexOf(END);
  if (s === -1 || e === -1 || e < s) return null;
  return src.slice(0, s) + block + src.slice(e + END.length);
}

async function updateMarkers(files, road, today) {
  const results = [];
  for (const file of files) {
    const full = path.join(ROOT, file);
    if (!existsSync(full)) {
      results.push({ file, status: "missing file" });
      continue;
    }
    const src = await readFile(full, "utf-8");
    const next = replaceMarkerBlock(src, buildStatusBlock(road, today));
    if (next === null) {
      results.push({ file, status: "no markers — add DOCS:STATUS:START/END to enable" });
      continue;
    }
    if (next !== src) await writeFile(full, next, "utf-8");
    results.push({ file, status: next === src ? "unchanged" : "updated" });
  }
  return results;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const stamp = new Date().toISOString();
  const today = stamp.slice(0, 10);

  const cfgPath = path.join(DOCS, "costs.config.json");
  if (!existsSync(cfgPath)) throw new Error(`Missing ${path.relative(ROOT, cfgPath)}`);
  const cfg = JSON.parse(await readFile(cfgPath, "utf-8"));

  const [repoStats, routes, docStats, road] = await Promise.all([
    collectRepoStats(),
    collectRoutes(),
    collectDocStats(),
    collectRoadmapState(),
  ]);

  await writeStats({ repoStats, routes, docStats, road }, today, stamp);
  await writeCosts(cfg, today, stamp);
  await writeSystemStatus(today, stamp);
  const markers = await updateMarkers(["README.md", "CLAUDE.md"], road, today);

  console.log("✓ docs refreshed");
  console.log(`  stats.md          ${repoStats.repos.filter((r) => r.available).length}/${REPOS.length} repos · ${docStats.total} docs`);
  console.log(`  costs.md          ${(cfg._verify ?? []).length} figures marked VERIFY`);
  console.log(`  system-status.md  ${SERVICE_KEYS.length} services checked`);
  for (const m of markers) console.log(`  ${m.file.padEnd(17)} ${m.status}`);
  if (docStats.missingFrontmatter) {
    console.warn(`  ⚠ ${docStats.missingFrontmatter} doc(s) have no frontmatter — invisible to the board`);
  }
}

// Only run when executed directly — lets tests import the pure helpers above
// without the script writing files as a side effect of the import.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`✗ refresh-docs failed: ${err.message}`);
    process.exit(1);
  });
}
