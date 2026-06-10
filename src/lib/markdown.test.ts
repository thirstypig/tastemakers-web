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
