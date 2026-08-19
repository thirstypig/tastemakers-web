// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ErrorBoundary from "./error";
import NotFound from "./not-found";

/**
 * The app tree had no `error.tsx`, `loading.tsx` or `not-found.tsx` anywhere, so
 * every uncaught render error and every unmatched URL fell through to Next's
 * built-in pages. On the public, SEO-indexed side that means a visitor arriving
 * from search at a stale restaurant slug saw an unstyled default with no route
 * back into the site.
 *
 * The point of a boundary is recovery, not decoration — a page that says
 * "something went wrong" and offers no way out is barely better than the
 * default. These tests pin the recovery affordance, not the wording: the error
 * boundary must actually invoke `reset`, and not-found must link somewhere real.
 */

afterEach(cleanup);

describe("root error boundary", () => {
  it("offers a retry that calls Next's reset", async () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);

    const retry = screen.getByRole("button", { name: /try again/i });
    retry.click();

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not leak the raw error message to the visitor", () => {
    render(
      <ErrorBoundary error={new Error("connect ECONNREFUSED 10.0.0.4:5432")} reset={vi.fn()} />,
    );

    expect(document.body.textContent).not.toContain("ECONNREFUSED");
  });

  it("offers a route back into the site", () => {
    render(<ErrorBoundary error={new Error("boom")} reset={vi.fn()} />);

    expect(screen.getByRole("link", { name: /explore/i })).toBeTruthy();
  });
});

describe("not-found page", () => {
  it("links back into the site rather than dead-ending", () => {
    render(<NotFound />);

    const home = screen.getByRole("link", { name: /explore/i });
    expect(home.getAttribute("href")).toBe("/explore");
  });
});
