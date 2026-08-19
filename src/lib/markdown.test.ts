import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown";

describe("renderMarkdown", () => {
  it("renders tables as real HTML, never [object Object]", () => {
    const html = renderMarkdown("| A | B |\n|---|---|\n| 1 | 2 |\n");
    expect(html).toContain("<table");
    expect(html).toContain("<td");
    expect(html).not.toContain("[object Object]");
  });

  it("renders inline formatting inside paragraphs and headings", () => {
    const html = renderMarkdown("# Hi `code`\n\nSome **bold** and [a link](https://x.com)\n");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<code>code</code>");
    expect(html).not.toContain("**bold**");
    expect(html).not.toContain("[a link]");
  });

  it("opens absolute links in a new tab with rel=noopener", () => {
    const html = renderMarkdown("[ext](https://example.com)");
    expect(html).toMatch(/<a [^>]*target="_blank"[^>]*href="https:\/\/example\.com"/);
    expect(html).toContain('rel="noopener"');
  });

  it("escapes raw HTML in code blocks", () => {
    const html = renderMarkdown("```\n<script>alert(1)</script>\n```\n");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

/**
 * TODO-097 (markdown half): `renderMarkdown` output is injected with
 * `dangerouslySetInnerHTML` at `src/app/admin/docs/[id]/page.tsx:177`, and nothing
 * sanitised it — `package.json` had no sanitizer dependency at all.
 *
 * Markdown is not a safe subset. GFM passes raw HTML straight through by design,
 * so a `<script>` in any rendered document became a script tag on the page.
 *
 * Severity, honestly: the input is repo files and the GitHub Contents API, not
 * user submissions, and /admin/docs is genuinely gated since the fail-open fix.
 * So this needs repo write access, not anonymity. That makes it defence in depth
 * rather than an open door — but "the content is trusted" is an assumption about
 * every future author and every future source, and sanitising costs nothing.
 *
 * These tests pin behaviour (what survives, what does not), not the library, so
 * swapping the sanitizer later will not rewrite them.
 */
describe("renderMarkdown sanitisation", () => {
  it("strips a script tag", () => {
    const html = renderMarkdown("hello\n\n<script>alert(1)</script>\n");
    expect(html).not.toContain("<script");
    expect(html).toContain("hello");
  });

  it("strips inline event handlers", () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)">');
    expect(html).not.toMatch(/onerror/i);
  });

  it("strips javascript: URLs", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toMatch(/javascript:/i);
  });

  it("strips iframes", () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe>');
    expect(html).not.toContain("<iframe");
  });

  it("keeps ordinary formatting intact", () => {
    const html = renderMarkdown("# Title\n\n**bold** and `code`\n\n- one\n- two\n");
    expect(html).toContain("<h1");
    expect(html).toContain("<strong>");
    expect(html).toContain("<code>");
    expect(html).toContain("<li>");
  });

  it("keeps tables, which the doc viewer relies on", () => {
    const html = renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |\n");
    expect(html).toContain("<table");
    expect(html).toContain("<td>");
  });

  it("keeps the target and rel attributes added to absolute links", () => {
    const html = renderMarkdown("[x](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
  });
});
