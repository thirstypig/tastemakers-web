import type { TagLevel } from "./levels";

/**
 * The five-level tag ramp, re-derived for the light canvas.
 *
 * The source design drew this ramp for the old `#1A1038` pages, where a
 * near-white L1 (`#EFE8FE`) reads at 15.01:1 and brightness tracks strength.
 * On the v2 canvas (`#F1F1F3`) that same fill measures **1.06:1** — the
 * strongest tag would vanish into the page and the weakest would dominate,
 * reproducing the exact defect the ramp was meant to fix. Inverted for a light
 * surface, dark = strong, which is also what iOS does.
 *
 * Measured against #FFFFFF (chips sit on cards):
 *   L1 14.92:1 · L2 11.75:1 · L3 8.12:1 · L4 4.68:1 — monotonic, all ≥4.5:1.
 *   L5 is an outline chip; its text is #6F6A80 at 5.19:1 (--tm-muted would
 *   have been 3.00:1 and failed).
 *
 * Level is carried by a second, non-colour channel as well — padding, weight
 * and size all grow with strength — so the hierarchy survives greyscale,
 * colour-blindness and a screenshot.
 */
export interface RampStep {
  background: string;
  color: string;
  fontWeight: number;
  fontSize: number;
  padding: string;
  border: string;
}

/**
 * Fills are spaced by *perceptual* lightness (L*), not by picking pleasant
 * hex values. The first version used the nearest existing tokens and produced
 * uneven steps — L1→L2 was only 7.8 L*, below the ~10 needed to read as a
 * different chip at a glance, while L4→L5 was 46. The two levels that matter
 * most looked identical and the bottom of the scale fell off a cliff.
 *
 * Now: L* 15.7 → 30.5 → 48.8 → 64.5 → outline, i.e. steps of ~15 throughout.
 * Text flips from white to ink between L3 and L4, which adds a second change
 * exactly at the midpoint of the scale.
 */
export const TAG_RAMP: Record<TagLevel, RampStep> = {
  1: {
    background: "var(--tm-purple)", // #2A1A5E · L* 15.7 · white 14.92:1
    color: "#fff",
    fontWeight: 700,
    fontSize: 14.5,
    padding: "0 15px",
    border: "1px solid transparent",
  },
  2: {
    background: "#4E3A88", // L* 30.5 · white 9.19:1
    color: "#fff",
    fontWeight: 600,
    fontSize: 13.5,
    padding: "0 13px",
    border: "1px solid transparent",
  },
  3: {
    background: "var(--tm-tag-light)", // #7C67B8 · L* 48.8 · white 4.68:1
    color: "#fff",
    fontWeight: 500,
    fontSize: 13,
    padding: "0 12px",
    border: "1px solid transparent",
  },
  4: {
    background: "#A493D2", // L* 64.5 · ink 6.31:1 — too light for white text
    color: "var(--tm-ink)",
    fontWeight: 500,
    fontSize: 12.5,
    padding: "0 11px",
    border: "1px solid transparent",
  },
  5: {
    background: "transparent",
    // Not --tm-muted: that is 3.00:1 on white and fails the 4.5:1 bar.
    color: "#6F6A80",
    fontWeight: 400,
    fontSize: 12,
    padding: "0 11px",
    border: "1px solid var(--tm-border)",
  },
};

/**
 * Heights grow with strength — the second channel, independent of colour.
 * Steps widened from 2/2/1/1px to 3/3/2/2px; the original were too fine to
 * perceive next to each other.
 */
export const TAG_RAMP_HEIGHT: Record<TagLevel, number> = {
  1: 34,
  2: 31,
  3: 28,
  4: 26,
  5: 24,
};

/** Ring marking a tag you voted for. v2 crimson, not the doc's #DB1657. */
export const MY_VOTE_RING = "0 0 0 2px var(--tm-crimson)";
