// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SiteFooter from "./SiteFooter";
import { APP_STORE_URL } from "./links";

/**
 * The App Store link used to be reachable only from PitchBand (signed-OUT
 * only) and FirstVisitExplainer (first visit only, then dismissed forever via
 * localStorage). A signed-in user browsing restaurants had no route to the iOS
 * app at all, and neither did anyone returning for a second visit.
 *
 * These tests pin the two properties that fix depends on: the link is present
 * unconditionally, and it points at the canonical listing.
 */

afterEach(cleanup);

describe("SiteFooter", () => {
  it("always offers the App Store link — no auth check, no dismissal state", () => {
    render(<SiteFooter />);
    const cta = screen.getByRole("link", { name: /Get Tastemakers for iPhone/i });
    expect(cta.getAttribute("href")).toBe(APP_STORE_URL);
  });

  it("points at the canonical listing URL, not the short redirecting form", () => {
    // apps.apple.com/app/id… 302s to the canonical URL. Linking the canonical
    // one directly avoids the hop for users and for crawlers.
    expect(APP_STORE_URL).toBe(
      "https://apps.apple.com/us/app/tastemakers-restaurant-reviews/id1573533249",
    );
    expect(APP_STORE_URL).toContain("/us/app/");
  });

  it("opens the App Store in a new tab without leaking the referrer window", () => {
    render(<SiteFooter />);
    const cta = screen.getByRole("link", { name: /Get Tastemakers for iPhone/i });
    expect(cta.getAttribute("target")).toBe("_blank");
    // target=_blank without noopener lets the opened page reach window.opener.
    expect(cta.getAttribute("rel")).toContain("noopener");
  });

  it("carries the standing nav links so the footer is useful beyond the CTA", () => {
    render(<SiteFooter />);
    for (const label of ["Restaurants", "Lists", "Cuisines", "Tastemakers", "Privacy"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
  });

  it("labels its nav landmark so screen readers can distinguish it from the top bar", () => {
    render(<SiteFooter />);
    expect(screen.getByRole("navigation", { name: /footer/i })).toBeTruthy();
  });
});
