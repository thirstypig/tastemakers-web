import { createServerClient } from "@/lib/supabase-server";
import {
  buildTagsByRestaurant,
  cityFromAddress,
  coverImage,
} from "@/lib/api/shared";
import { likePattern, sanitizeSearchTerm } from "./query";
import { buildSlug } from "@/lib/slug";
import type { Restaurant, ListSummary, Tag } from "@/lib/api/types";

// ── Search ────────────────────────────────────────────────────────────────────

export interface TagHit {
  id: string;
  name: string;
  placeCount: number;
}

export interface SearchResults {
  term: string;
  /** The city restaurant hits were restricted to, or null for everywhere. */
  city: string | null;
  restaurants: Restaurant[];
  lists: ListSummary[];
  tags: TagHit[];
}

const SEARCH_LIMIT = 50;

/**
 * Search restaurants, lists and tags for one term.
 *
 * Every query is filtered and LIMITed in the database. This deliberately does
 * not follow listRestaurants(), which pulls up to 5,000 rows and narrows them
 * in JS — PostgREST caps responses around 1,000, so that approach silently
 * searches an arbitrary slice (todo 090).
 */
export async function searchAll(
  rawQuery: string,
  /** Restrict restaurant hits to one city. Undefined searches everywhere. */
  rawCity?: string,
): Promise<SearchResults> {
  const term = sanitizeSearchTerm(rawQuery);
  if (!term) return { term: "", city: null, restaurants: [], lists: [], tags: [] };

  const sb = createServerClient();
  const pattern = likePattern(term);
  const city = rawCity ? sanitizeSearchTerm(rawCity) : "";

  // City is matched as a whole address segment (", Los Angeles,") so "York"
  // cannot match "New York" and a street name cannot match a city.
  const restaurantQuery = sb
    .from("restaurants")
    .select("id, place_id, name, address, lat, lng")
    .is("deleted_at", null)
    .or(`name.ilike.${pattern},address.ilike.${pattern}`);
  if (city) restaurantQuery.ilike("address", `*, ${city},*`);

  const [{ data: restaurantRows }, { data: listRows }, { data: tagRows }] = await Promise.all([
    restaurantQuery.limit(SEARCH_LIMIT),
    // testmaker_list has no deleted_at column — see getRestaurantDetail.
    sb.from("testmaker_list").select("id, list_name, user_id").ilike("list_name", pattern).limit(SEARCH_LIMIT),
    sb.from("tags").select("id, name").is("deleted_at", null).ilike("name", pattern).limit(SEARCH_LIMIT),
  ]);

  // Tags for the matched restaurants only, for each card's strip footer.
  const restaurantIds = (restaurantRows ?? []).map((r) => r.id);
  let tagsByRestaurant = new Map<number, Tag[]>();
  if (restaurantIds.length > 0) {
    const { data: linkRows } = await sb
      .from("restaurant_tag")
      .select("restaurant_id, tag_id")
      .in("restaurant_id", restaurantIds);

    const linkTagIds = [...new Set((linkRows ?? []).map((l) => l.tag_id))];
    const { data: linkTagData } = linkTagIds.length > 0
      ? await sb.from("tags").select("id, name").in("id", linkTagIds).is("deleted_at", null)
      : { data: [] };

    const nameById = new Map<number, string>();
    linkTagData?.forEach((t) => nameById.set(t.id, t.name));
    tagsByRestaurant = buildTagsByRestaurant(linkRows ?? [], nameById, 3);
  }

  const restaurants: Restaurant[] = (restaurantRows ?? []).map((r) => ({
    id: String(r.id),
    slug: buildSlug(r.name, r.id),
    name: r.name ?? "Unknown",
    address: r.address ?? "",
    neighborhood: cityFromAddress(r.address),
    city: cityFromAddress(r.address),
    cuisine: tagsByRestaurant.get(r.id)?.[0]?.name ?? "Restaurant",
    imageUrl: coverImage(r.id),
    tags: tagsByRestaurant.get(r.id) ?? [],
    foursquareId: r.place_id ?? undefined,
    latitude: r.lat ? parseFloat(r.lat) : undefined,
    longitude: r.lng ? parseFloat(r.lng) : undefined,
  }));

  // List sizes and curators, bounded to the matched lists.
  const listIds = (listRows ?? []).map((l) => l.id);
  const ownerIds = [...new Set((listRows ?? []).map((l) => l.user_id).filter(Boolean))];
  const [{ data: sizeRows }, { data: owners }] = await Promise.all([
    listIds.length > 0
      ? sb.from("testmaker_list_restaurant").select("testmaker_list_id").in("testmaker_list_id", listIds)
      : Promise.resolve({ data: [] as Array<{ testmaker_list_id: number }> }),
    ownerIds.length > 0
      ? sb.from("users").select("id, first_name, last_name, username").in("id", ownerIds)
      : Promise.resolve({ data: [] as Array<{ id: number; first_name: string | null; last_name: string | null; username: string | null }> }),
  ]);

  const sizeByList = new Map<number, number>();
  sizeRows?.forEach((s) => {
    sizeByList.set(s.testmaker_list_id, (sizeByList.get(s.testmaker_list_id) ?? 0) + 1);
  });
  const ownerName = new Map<number, string>();
  owners?.forEach((u) => {
    const n = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || (u.username ?? "");
    if (n) ownerName.set(u.id, n);
  });

  const lists: ListSummary[] = (listRows ?? []).map((l) => {
    const count = sizeByList.get(l.id) ?? 0;
    const places = `${count} ${count === 1 ? "place" : "places"}`;
    const curator = ownerName.get(l.user_id);
    return {
      id: String(l.id),
      slug: buildSlug(l.list_name, l.id),
      title: l.list_name ?? "Untitled list",
      meta: curator ? `${places} · ${curator}` : places,
      thumbnailUrl: coverImage(l.id, 150),
    };
  });

  // How many places carry each matched tag.
  const matchedTagIds = (tagRows ?? []).map((t) => t.id);
  const { data: usageRows } = matchedTagIds.length > 0
    ? await sb.from("restaurant_tag").select("tag_id, restaurant_id").in("tag_id", matchedTagIds)
    : { data: [] };

  const placesByTag = new Map<number, Set<number>>();
  usageRows?.forEach((u) => {
    const set = placesByTag.get(u.tag_id) ?? new Set<number>();
    set.add(u.restaurant_id);
    placesByTag.set(u.tag_id, set);
  });

  const tags: TagHit[] = (tagRows ?? [])
    .map((t) => ({
      id: String(t.id),
      name: t.name,
      placeCount: placesByTag.get(t.id)?.size ?? 0,
    }))
    .sort((a, b) => b.placeCount - a.placeCount);

  return { term, city: city || null, restaurants, lists, tags };
}
