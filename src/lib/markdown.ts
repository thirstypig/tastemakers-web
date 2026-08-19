import { Marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

// Default renderer only — custom renderer overrides broke across marked's
// token-based API (v13+): table tokens stringified to "[object Object]" and
// heading/paragraph text skipped inline parsing. Styling lives in CSS
// (.md-body rules in the doc viewer), not in the renderer.
const md = new Marked({ gfm: true });

/**
 * Render markdown to HTML, sanitised.
 *
 * The output is injected with `dangerouslySetInnerHTML` in the doc viewer
 * (`app/admin/docs/[id]/page.tsx`), and nothing sanitised it — there was no
 * sanitizer dependency in the project at all (TODO-097).
 *
 * Markdown is not a safe subset: GFM passes raw HTML through by design, so a
 * `<script>` in any rendered document became a script tag on the page.
 *
 * The realistic severity was moderate — the input is repo files and the GitHub
 * Contents API rather than user submissions, and /admin/docs is properly gated
 * since the fail-open fix — so this is defence in depth. But "the content is
 * trusted" is an assumption about every future author and every future source,
 * and sanitising costs nothing.
 *
 * Order matters: sanitise the parsed HTML FIRST, then add link attributes. Doing
 * it the other way round would hand DOMPurify attributes to strip and quietly
 * undo the `target`/`rel` handling below.
 */
export function renderMarkdown(markdown: string): string {
  const raw = md.parse(markdown, { async: false });

  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    // The doc viewer renders GFM tables; keep the elements they need.
    ADD_TAGS: ["table", "thead", "tbody", "tr", "th", "td"],
  });

  // Default renderer has no hook for link targets that survives API versions;
  // post-process absolute links instead. Applied after sanitisation so these
  // attributes are not themselves stripped.
  return clean.replace(
    /<a href="(https?:\/\/[^"]*)"/g,
    '<a target="_blank" rel="noopener" href="$1"',
  );
}
