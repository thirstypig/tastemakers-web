/**
 * Outbound links that appear in more than one place.
 *
 * The App Store URL was previously duplicated as a `const APP_STORE` inside
 * both PitchBand and FirstVisitExplainer, in the short `apps.apple.com/app/id…`
 * form. Two copies of a URL drift; this is the single source.
 *
 * Use the full canonical listing URL rather than the short form — the short
 * one 302s, and the canonical one is what Apple surfaces for sharing and what
 * search engines resolve without a hop.
 */
export const APP_STORE_URL =
  "https://apps.apple.com/us/app/tastemakers-restaurant-reviews/id1573533249";

/** Apple's numeric listing id, for analytics and deep links. */
export const IOS_APP_ID = "1573533249";
