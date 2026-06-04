// Google AdSense configuration — single source of truth for the publisher ID,
// manual Display ad-unit slots, and the master enable switch.

export const ADSENSE_CLIENT = "ca-pub-7103672049879516";

// Manual Display ad units (responsive). Created in AdSense → Ads → By ad unit.
export const AD_SLOTS = {
  restaurantsFeed: "9965483914", // listing pages: /restaurants, /lists, /tastemakers
  detailFooter: "4365821262", // detail pages: /restaurants|lists|tastemakers/[slug]
} as const;

// Master switch. Keep FALSE until the AdSense account is APPROVED — otherwise
// ad slots render as blank reserved space to real visitors. Flip to true
// (one-line change) once ads are eligible to serve.
export const ADS_ENABLED = false;
