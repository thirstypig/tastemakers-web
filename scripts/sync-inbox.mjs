#!/usr/bin/env node
/**
 * sync-inbox.mjs — regenerate docs/INBOX.md from the comment data source.
 *
 * Reads open comments and writes docs/INBOX.md, grouped by kind, newest first,
 * with change_request items at the top.
 *
 * Run:  node scripts/sync-inbox.mjs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO(james): POINT THIS AT THE REAL DATA SOURCE.
 *
 * Right now it reads the local stub at docs/_comments.json so the loop works
 * today. The real source is Supabase (the same project the admin board already
 * uses). To switch over, replace loadComments() with a Supabase query:
 *
 *   import { createClient } from "@supabase/supabase-js";
 *   const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
 *   const { data, error } = await db
 *     .from("doc_comments")
 *     .select("id, doc, kind, status, author, created, body, resolution")
 *     .order("created", { ascending: false });
 *
 * The table does not exist yet. Nothing else in this script needs to change —
 * everything downstream works off the same comment shape.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "docs", "_comments.json");
const OUTPUT = path.join(ROOT, "docs", "INBOX.md");

/** change_request first — that is the whole point of the ordering. */
const KIND_ORDER = ["change_request", "question", "note"];

const KIND_LABEL = {
  change_request: "Change requests",
  question: "Questions",
  note: "Notes",
};

const KIND_BLURB = {
  change_request: "Asks for a change to a doc or to the code. **Act on these first.**",
  question: "Asks for information. Answer, then resolve with the answer as the note.",
  note: "Context with no action attached. Read and resolve, or leave for later.",
};

const STATUS_BADGE = { open: "`open`", in_review: "`in_review`", resolved: "`resolved`" };

const UNRESOLVED = new Set(["open", "in_review"]);
const VALID_KINDS = new Set(KIND_ORDER);
const VALID_STATUSES = new Set(["open", "in_review", "resolved"]);

async function loadComments() {
  let raw;
  try {
    raw = await readFile(SOURCE, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(
        `No comment source found at ${path.relative(ROOT, SOURCE)}.\n` +
          `Create it (see docs/README-DOCS.md section 7) or point loadComments() at Supabase.`
      );
    }
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${path.relative(ROOT, SOURCE)} is not valid JSON: ${err.message}`);
  }

  if (!Array.isArray(parsed.comments)) {
    throw new Error(`${path.relative(ROOT, SOURCE)} must contain a "comments" array.`);
  }
  return parsed.comments;
}

/** Drop malformed rows loudly rather than silently rendering nonsense. */
function validate(comments) {
  const kept = [];
  const warnings = [];

  for (const [i, c] of comments.entries()) {
    const where = c?.id ?? `index ${i}`;
    if (!c?.id || !c?.doc || !c?.kind || !c?.status) {
      warnings.push(`${where}: missing a required field (id, doc, kind, status) — skipped`);
      continue;
    }
    if (!VALID_KINDS.has(c.kind)) {
      warnings.push(`${where}: unknown kind "${c.kind}" — skipped`);
      continue;
    }
    if (!VALID_STATUSES.has(c.status)) {
      warnings.push(`${where}: unknown status "${c.status}" — skipped`);
      continue;
    }
    kept.push(c);
  }
  return { kept, warnings };
}

/** Newest first. Undated rows sort last rather than throwing. */
function byNewest(a, b) {
  const ta = Date.parse(a.created ?? "");
  const tb = Date.parse(b.created ?? "");
  if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
  if (Number.isNaN(ta)) return 1;
  if (Number.isNaN(tb)) return -1;
  return tb - ta;
}

function formatDate(iso) {
  const t = Date.parse(iso ?? "");
  return Number.isNaN(t) ? "undated" : new Date(t).toISOString().slice(0, 10);
}

function renderComment(c) {
  const lines = [
    `#### ${c.id} · ${STATUS_BADGE[c.status]} · on \`${c.doc}\``,
    "",
    `*${c.author ?? "unknown"} · ${formatDate(c.created)}*`,
    "",
    c.body?.trim() || "_(no body)_",
  ];

  if (c.resolution) {
    lines.push(
      "",
      `> **Resolved** ${formatDate(c.resolution.resolved)} by ${c.resolution.by ?? "unknown"}` +
        (c.resolution.link ? ` → \`${c.resolution.link}\`` : ""),
      `> ${c.resolution.note ?? "_(no note)_"}`
    );
  }
  return lines.join("\n");
}

function render(comments, warnings, generatedAt) {
  const unresolved = comments.filter((c) => UNRESOLVED.has(c.status));
  const resolved = comments.filter((c) => c.status === "resolved").sort(byNewest);

  const KIND_NOUN = { change_request: "change request", question: "question", note: "note" };
  const counts = KIND_ORDER.map((k) => {
    const n = unresolved.filter((c) => c.kind === k).length;
    return `${n} ${KIND_NOUN[k]}${n === 1 ? "" : "s"}`;
  }).join(" · ");

  const out = [
    "---",
    "id: DOC-012",
    "type: inbox",
    "status: active",
    "phase: null",
    "owner: james",
    "tags: []",
    "links: [DOC-001]",
    `updated: ${generatedAt.slice(0, 10)}`,
    "---",
    "",
    "# Comment inbox",
    "",
    "> **GENERATED — do not hand-edit.** Regenerate with `node scripts/sync-inbox.mjs`.",
    "> Edit `docs/_comments.json` instead; this file is overwritten on every run.",
    "",
    `**${unresolved.length} unresolved** — ${counts}.`,
    "",
    "Read this at the start of every session. Act on change requests, answer questions,",
    "then write a resolution so the item clears. See `README-DOCS.md` section 7.",
    "",
  ];

  if (warnings.length) {
    out.push(
      "> ⚠️ **Some comments were skipped as malformed:**",
      ...warnings.map((w) => `> - ${w}`),
      ""
    );
  }

  for (const kind of KIND_ORDER) {
    const group = unresolved.filter((c) => c.kind === kind).sort(byNewest);
    out.push("---", "", `## ${KIND_LABEL[kind]} (${group.length})`, "", `${KIND_BLURB[kind]}`, "");
    out.push(group.length ? group.map(renderComment).join("\n\n") : "_Nothing open._", "");
  }

  if (resolved.length) {
    out.push(
      "---",
      "",
      `## Recently resolved (${Math.min(resolved.length, 5)} of ${resolved.length})`,
      "",
      "Kept briefly for context. These no longer need action.",
      "",
      resolved.slice(0, 5).map(renderComment).join("\n\n"),
      ""
    );
  }

  out.push("---", "", `<!-- generated ${generatedAt} by scripts/sync-inbox.mjs -->`, "");
  return out.join("\n");
}

async function main() {
  const comments = await loadComments();
  const { kept, warnings } = validate(comments);
  const generatedAt = new Date().toISOString();

  await writeFile(OUTPUT, render(kept, warnings, generatedAt), "utf-8");

  const unresolved = kept.filter((c) => UNRESOLVED.has(c.status)).length;
  const changeRequests = kept.filter(
    (c) => c.kind === "change_request" && UNRESOLVED.has(c.status)
  ).length;

  console.log(`✓ wrote ${path.relative(ROOT, OUTPUT)}`);
  console.log(`  ${kept.length} comments read · ${unresolved} unresolved · ${changeRequests} change request(s)`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
}

main().catch((err) => {
  console.error(`✗ sync-inbox failed: ${err.message}`);
  process.exit(1);
});
