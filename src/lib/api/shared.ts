/**
 * Helpers shared by the feature API modules.
 *
 * Each feature owns its own queries in its own `api.ts`; anything used by more
 * than one of them lives here, so no feature has to import another feature's
 * data layer.
 */
import { levelFor } from "@/features/tags/levels";
import { buildSlug } from "@/lib/slug";
import type { Tag } from "./types";

// ── Paging ────────────────────────────────────────────────────────────────────

/** PostgREST's server-side max-rows cap. `.limit(5000)` still returns 1000. */
export const POSTGREST_PAGE = 1000;

/**
 * Read every row of a query by walking ranges.
 *
 * PostgREST silently truncates at its configured max-rows (1000 here,
 * verified against production), so a `.limit(5000)` on a 4,230-row table
 * returns a quarter of it with no error and no indication. Any aggregate
 * computed from that is wrong in a way nothing surfaces.
 *
 * Takes a page fetcher rather than a query builder so the paging logic can be
 * tested without a database.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[] | null>,
  { pageSize = POSTGREST_PAGE, maxRows = 100_000 } = {},
): Promise<T[]> {
  const out: T[] = [];

  for (let from = 0; from < maxRows; from += pageSize) {
    const rows = await fetchPage(from, from + pageSize - 1);
    if (!rows || rows.length === 0) break;
    out.push(...rows);
    // A short page means we reached the end.
    if (rows.length < pageSize) break;
  }

  return out;
}

// ── Image placeholders (deterministic from curated food photos) ───────────────

const FOOD_PHOTOS = [
  "photo-1414235077428-338989a2e8c0",
  "photo-1555396273-367ea4eb4db5",
  "photo-1510812431401-41d2bd2722f3",
  "photo-1568901346375-23c9450c58cd",
  "photo-1569718212165-3a8278d5f624",
  "photo-1519984388953-d2406bc725e1",
  "photo-1498579150354-977475b7ea0b",
  "photo-1574071318508-1cdbab80d002",
  "photo-1513104890138-7c749659a591",
  "photo-1504674900247-0877df9cc836",
  "photo-1540189549336-e6e99c3679fe",
  "photo-1565299624946-b28f40a0ae38",
  "photo-1482049016688-2d3e1b311543",
  "photo-1484723091739-30a097e8f929",
  "photo-1467003909585-2f8a72700288",
];

export function coverImage(id: number, w = 800): string {
  const idx = id % FOOD_PHOTOS.length;
  return `https://images.unsplash.com/${FOOD_PHOTOS[idx]}?w=${w}&q=80`;
}

// ── Tag helpers ───────────────────────────────────────────────────────────────

/**
 * Build a per-restaurant map of tags sorted by vote count (popularity).
 * restaurant_tag has one row per user per tag — duplicate (restaurant_id, tag_id)
 * pairs are votes. More votes = higher rank.
 */
export function buildTagsByRestaurant(
  tagRows: Array<{ restaurant_id: number; tag_id: number }>,
  tagMap: Map<number, string>,
  maxTagsPerRestaurant = 6,
): Map<number, Tag[]> {
  const voteMap = new Map<string, number>();
  for (const r of tagRows) {
    const key = `${r.restaurant_id}:${r.tag_id}`;
    voteMap.set(key, (voteMap.get(key) ?? 0) + 1);
  }

  // Levels are relative to each restaurant's OWN leading tag (the iOS rule),
  // so the top count has to be known per restaurant before levelling.
  const topByRestaurant = new Map<number, number>();
  for (const [key, count] of voteMap) {
    const rid = Number(key.split(":")[0]);
    if (count > (topByRestaurant.get(rid) ?? 0)) topByRestaurant.set(rid, count);
  }

  const byRestaurant = new Map<number, Tag[]>();
  for (const [key, count] of [...voteMap.entries()].sort((a, b) => b[1] - a[1])) {
    const [ridStr, tidStr] = key.split(":");
    const rid = Number(ridStr);
    const tid = Number(tidStr);
    const name = tagMap.get(tid);
    if (!name) continue;
    const existing = byRestaurant.get(rid) ?? [];
    if (existing.length < maxTagsPerRestaurant) {
      const level = levelFor(count, topByRestaurant.get(rid) ?? count);
      existing.push({ id: String(tid), name, level, count });
      byRestaurant.set(rid, existing);
    }
  }
  return byRestaurant;
}

// ── Address helpers ───────────────────────────────────────────────────────────

/** "182 Havemeyer St, Brooklyn, NY 11211, United States" → "Brooklyn" */
export function cityFromAddress(address: string | null): string {
  if (!address) return "";
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 3) return parts[parts.length - 3] ?? "";
  if (parts.length >= 2) return parts[parts.length - 2] ?? "";
  return "";
}

export function tasteLevel(listCount: number): 1 | 2 | 3 | 4 | 5 {
  if (listCount >= 20) return 5;
  if (listCount >= 10) return 4;
  if (listCount >= 5) return 3;
  if (listCount >= 2) return 2;
  return 1;
}

/**
 * The word a visitor reads for a taste level.
 *
 * Lived as a `LEVEL_LABEL` constant copy-pasted into both the tastemakers index
 * and the profile page, so the same person could be shown as two different tiers
 * depending on which page you were on. One definition, next to the `tasteLevel`
 * that produces the number.
 *
 * Falls back rather than returning undefined: the parameter is a plain number,
 * so anything can reach it, and a missing key would render the literal string
 * "undefined" next to someone's name.
 */
export function levelLabel(level: number): string {
  const LABELS: Record<number, string> = {
    1: "Explorer",
    2: "Curator",
    3: "Connoisseur",
    4: "Maven",
    5: "Legend",
  };

  return LABELS[level] ?? "Curator";
}

/** Shape a restaurants row into the shared Restaurant type. */
export function toRestaurant(
  r: {
    id: number;
    place_id?: string | null;
    name?: string | null;
    address?: string | null;
    lat?: string | null;
    lng?: string | null;
  },
  tags: Tag[],
) {
  return {
    id: String(r.id),
    slug: buildSlug(r.name, r.id),
    name: r.name ?? "Unknown",
    address: r.address ?? "",
    neighborhood: cityFromAddress(r.address ?? null),
    city: cityFromAddress(r.address ?? null),
    cuisine: tags[0]?.name ?? "Restaurant",
    imageUrl: coverImage(r.id),
    tags,
    foursquareId: r.place_id ?? undefined,
    latitude: r.lat ? parseFloat(r.lat) : undefined,
    longitude: r.lng ? parseFloat(r.lng) : undefined,
  };
}
