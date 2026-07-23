---
id: SOL-003
type: solution
status: done
owner: james
links: [DOC-011]
updated: 2026-06-10
title: "Admin doc viewer renders tables as '[object Object]' and private-repo docs fail to load"
slug: "marked-v13-token-api-object-object-tables"
category: "ui-bugs"
problem_type: "library_api_breaking_change"
symptoms:
  - "Markdown tables render as '[object Object],[object Object],...' in /admin/docs"
  - "Inline **bold** and [links](...) render as literal asterisks/brackets (quieter symptom)"
  - "master-ports, backend-readme, and all private-repo docs show 'Could not load document'"
component: "src/app/admin/docs/[id]/page.tsx, src/lib/markdown.ts, src/lib/docs.ts"
environment: "Next.js 15, marked v18, GitHub private repos, local + Railway production"
tags: ["marked", "markdown", "renderer", "breaking-change", "github-api", "private-repo", "raw-githubusercontent", "contents-api", "github-token", "admin-docs"]
severity: "high"
date_solved: "2026-06-10"
time_to_solve: "~30 min (systematic debugging: reproduce → root cause → fix)"
related:
  - docs/solutions/deployment-issues/railway-nextjs-oauth-redirect-localhost.md
---

## Problem

Two distinct bugs surfaced together on `/admin/docs/[id]` after the docs reorg made the
content table-heavy:

1. Every markdown table rendered as comma-joined `[object Object]` garbage.
2. Six of seven GitHub-sourced docs showed "Could not load document"
   (`master-ports`, `backend-readme`, `backend-claude`, `backend-todos`,
   `ios-claude`, `android-claude`). Only `web-claude` loaded.

## Investigation

- Reproduced bug 1 in isolation: ran the page's exact custom renderer overrides
  through the installed `marked` (v18) with a small markdown sample. Output:
  `<table>[object Object],[object Object]...</table>` — and as a bonus finding,
  headings/paragraphs showed **raw** inline markdown (`**bold**` literal).
- Checked repo visibility with `gh repo view --json visibility`: backend, ios,
  android are **PRIVATE**; web is public. Curled
  `raw.githubusercontent.com/...` unauthenticated → 404 for all private-repo files.
  That mapped exactly to which docs failed.

## Root causes

1. **marked v13+ changed the renderer API from strings to token objects.**
   The page's custom renderer (`renderer.table = ({ header, rows }) => ...`)
   was written for the old string-based API. In the token API, `header`/`rows`
   are arrays of cell token objects, so template interpolation stringifies them
   to `[object Object]`. Worse: `heading`/`paragraph` overrides used `token.text`
   (raw source) instead of parsing inline tokens, so bold/links never rendered.
   Also, when `table` is overridden in the new API, `tablerow`/`tablecell`
   overrides are dead code — the table override is responsible for everything.
   The bug was latent since the page was built; early docs just had few tables.

2. **`raw.githubusercontent.com` returns 404 for private repos without auth.**
   The viewer fetched doc content from raw URLs unauthenticated. Public repo
   (web) worked; private repos (backend/ios/android) 404'd.

## Solution

1. **Deleted the entire custom renderer.** New `renderMarkdown()` in
   `src/lib/markdown.ts` uses marked's **default renderer** (correct across API
   versions, inline tokens parsed properly); all visual styling moved to
   `.md-body` CSS rules in the viewer page. Link `target="_blank"` is applied by
   post-processing the HTML string, not a renderer hook:

   ```ts
   const md = new Marked({ gfm: true });
   export function renderMarkdown(markdown: string): string {
     const html = md.parse(markdown, { async: false });
     return html.replace(/<a href="(https?:\/\/[^"]*)"/g,
       '<a target="_blank" rel="noopener" href="$1"');
   }
   ```

2. **Switched `fetchMarkdown()` to the GitHub Contents API** with auth:

   ```ts
   const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(file)}?ref=${branch}`;
   const res = await fetch(url, {
     headers: { ...githubHeaders(), Accept: "application/vnd.github.raw+json" },
     next: { revalidate: 300 },
   });
   ```

   `githubHeaders()` adds `Authorization: Bearer ${GITHUB_TOKEN}` when set.
   Token provisioning: local dev `.env.local` (gitignored); production = a
   **fine-grained PAT** (resource owner `thirstypig`, read-only **Contents** on
   backend/ios/android) set as `GITHUB_TOKEN` on the Railway web service.

Verified by a live sweep: all 13 registry docs fetched + rendered with zero
`[object Object]`. Shipped in PR #16.

## Prevention

- **Never add custom `marked` renderer overrides in this repo.**
  `renderMarkdown()` in `src/lib/markdown.ts` is the only sanctioned markdown
  path; style via `.md-body` CSS. Unit tests in `src/lib/markdown.test.ts` pin
  tables, inline formatting, link targets, and HTML escaping — they fail if
  anyone reintroduces a renderer that regresses these.
- **Treat `raw.githubusercontent.com` as public-only.** Any GitHub file fetch
  that might touch a private repo must go through `api.github.com` Contents API
  with `githubHeaders()`.
- **GITHUB_TOKEN expires ~2027-06.** When it does, private-repo docs silently
  revert to "Could not load" — regenerate the PAT and update Railway +
  `.env.local`. (Also recorded in Claude memory.)
- When a rendering library majors (marked v12→v13 changed renderer signatures),
  grep for `new marked.Renderer()` / `renderer.` overrides before upgrading.

## Symptom → cause cheat sheet

| Symptom | Cause |
|---|---|
| `[object Object]` in rendered markdown | Custom renderer written for pre-v13 string API receiving token objects |
| Bold/links show literal `**`/`[]` | Renderer override using `token.text` instead of parsing inline tokens |
| "Could not load document" for some GitHub docs only | Those repos are private; unauthenticated raw fetch 404s |
