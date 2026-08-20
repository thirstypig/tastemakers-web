import type { Tag } from "@/lib/api/types";

export type TagLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Assign tag levels as a **share of the leading tag**.
 *
 * ## The model is proportional, and that is a product decision
 *
 * James, 2026-08-20: levels depend on the total number of voted tags, so with
 * few voters or few votes the scale *adjusts*. It is percentage-based.
 *
 * ## This deliberately diverges from iOS
 *
 * This used to be a direct port of `Utils.calcucateTagLevels`
 * (tastemakers-ios/TasteMaker/Miscellaneous/Utils.swift:334):
 *
 *     gap = highestCount - count
 *     gap < 1 → L1, == 1 → L2, == 2 → L3, == 3 → L4, else L5
 *
 * That rule is a *subtraction*, so it only behaves while counts are tiny — the
 * 1-to-5 range iOS was written around. It degenerates exactly when voting
 * recovers and ranking starts to matter:
 *
 *     votes 50, 47, 30, 12, 4
 *       gap   → L1, L4, L5, L5, L5   ← anything under 47 is L5
 *       share → L1, L1, L2, L4, L5
 *
 * Three of five levels collapse. The same degeneracy showed up on a
 * tastemaker's tag frequencies (93, 88, 58, …), where gap-from-leader put the
 * top tag at L1 and every other tag at L5.
 *
 * **Web and iOS now rank differently, on purpose.** That is the same divergence
 * the port was introduced to remove, so it is worth being explicit: it is
 * accepted until an iOS release carries the proportional rule, and old installs
 * will keep the gap rule for months after that. Do not "restore parity" by
 * reverting this — raise it instead.
 *
 * Changed while every (restaurant, tag) pair in production had exactly one vote
 * (4,230 of 4,230, verified 2026-08-20), so nothing visibly moved. Doing it
 * after the vote data spreads would have shifted rankings under users.
 *
 * `levelForGap` is kept below as the historical rule, used only by the tests
 * that assert this divergence.
 *
 * Ties keep input order, matching Swift's stable `sorted(by:)` for equal keys
 * closely enough for display purposes; callers that need determinism across
 * requests should pre-sort by id.
 */
export function assignTagLevels<T extends { count?: number }>(
  tags: readonly T[],
): Array<T & { level: TagLevel }> {
  const sorted = [...tags].sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  if (sorted.length === 0) return [];

  const highest = sorted[0]!.count ?? 0;

  return sorted.map((t) => ({ ...t, level: levelForShare(t.count ?? 0, highest) }));
}

/** The gap → level mapping, isolated so it can be asserted directly. */
export function levelForGap(gap: number): TagLevel {
  if (gap < 1) return 1;
  if (gap === 1) return 2;
  if (gap === 2) return 3;
  if (gap === 3) return 4;
  return 5;
}

/**
 * Level a single count against a known leader.
 * Convenience for call sites that already know the top count.
 */
export function levelFor(count: number, highestCount: number): TagLevel {
  return levelForShare(count, highestCount);
}

/** Sort a levelled list back into display order: strongest first. */
export function byStrength(a: Pick<Tag, "count">, b: Pick<Tag, "count">): number {
  return (b.count ?? 0) - (a.count ?? 0);
}

/**
 * Level a tag by its share of the leader, for the "Known for" cloud on a
 * tastemaker profile.
 *
 * **Deliberately NOT `levelForGap`.** That rule is a tag's absolute distance
 * from the leader, which is right for per-restaurant vote counts — those are
 * single digits, so a gap of 3 is meaningful. A person's tag *frequency* is a
 * different quantity on a different scale: Thirsty Pig's top tags run
 * 93, 88, 58, 58, 56, 45, 40, 26, 14, … so gap-from-leader puts the top tag at
 * L1 and every other tag at L5, which is not a ramp, it is a flag.
 *
 * Share-of-leader keeps the same "relative to this person's strongest" idea
 * while staying meaningful across magnitudes. Against the real distribution
 * above it yields L1x2, L2x3, L3x2, L4x1, L5xrest — a genuine spread.
 *
 * Thresholds are quintiles of the leader, matching the five-step ramp the
 * design system already defines.
 */
export function levelForShare(count: number, highestCount: number): TagLevel {
  if (highestCount <= 0) return 5;
  const share = count / highestCount;
  if (share >= 0.8) return 1;
  if (share >= 0.6) return 2;
  if (share >= 0.4) return 3;
  if (share >= 0.2) return 4;
  return 5;
}
