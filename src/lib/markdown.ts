import { Marked } from "marked";

// Default renderer only — custom renderer overrides broke across marked's
// token-based API (v13+): table tokens stringified to "[object Object]" and
// heading/paragraph text skipped inline parsing. Styling lives in CSS
// (.md-body rules in the doc viewer), not in the renderer.
const md = new Marked({ gfm: true });

export function renderMarkdown(markdown: string): string {
  const html = md.parse(markdown, { async: false });
  // Default renderer has no hook for link targets that survives API versions;
  // post-process absolute links instead.
  return html.replace(/<a href="(https?:\/\/[^"]*)"/g, '<a target="_blank" rel="noopener" href="$1"');
}
