import type { Tag } from "@/lib/api/types";

export type TagLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Assign tag levels the way iOS does.
 *
 * Direct port of `Utils.calcucateTagLevels` in
 * tastemakers-ios/TasteMaker/Miscellaneous/Utils.swift:334 —
 *
 *     sorted by count desc; highestCount = first.count
 *     gap = highestCount - count
 *     gap < 1 → L1, == 1 → L2, == 2 → L3, == 3 → L4, else L5
 *
 * The level is a tag's distance from the *leader*, not its absolute count.
 * Web previously used fixed thresholds (>=10 → L1, >=5 → L2, >=3 → L3,
 * >=2 → L4), which made the same restaurant rank differently in each product:
 * a place whose top tag has 4 votes shows a full-strength L1 chip on iOS and
 * a faded L4 chip on web.
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

  return sorted.map((t) => ({ ...t, level: levelForGap(highest - (t.count ?? 0)) }));
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
  return levelForGap(highestCount - count);
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
