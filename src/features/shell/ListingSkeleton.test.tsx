// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ListingSkeleton from "./ListingSkeleton";

/**
 * The Supabase-backed listing pages have no `loading.tsx`, so a slow read shows
 * the previous route until it resolves — the navigation looks ignored.
 *
 * A skeleton is only half the fix. Assistive tech needs to be told the region is
 * busy, otherwise a screen-reader user gets silence rather than "loading", so
 * that is what these tests pin rather than the shape of the placeholder boxes.
 */

afterEach(cleanup);

describe("ListingSkeleton", () => {
  it("announces itself as a busy status region", () => {
    render(<ListingSkeleton />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
  });

  it("carries an accessible loading label", () => {
    render(<ListingSkeleton label="Loading restaurants" />);

    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Loading restaurants");
  });
});
