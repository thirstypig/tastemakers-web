import { createServerClient } from "@/lib/supabase-server";
import {
  buildTagsByRestaurant,
  cityFromAddress,
  coverImage,
} from "@/lib/api/shared";
import { sanitizeSearchTerm } from "@/features/search/query";
import { DEFAULT_CITY } from "@/lib/api/cities";
import { buildSlug } from "@/lib/slug";
import type { Restaurant, ListSummary } from "@/lib/api/types";

// ── Home ──────────────────────────────────────────────────────────────────────

export interface HomeData {
  city: string;
  lists: ListSummary[];
  recentlyTagged: Restaurant[];
}

const CITY_RESTAURANT_CAP = 300;

/**
 * Home: the lists and recent tagging for one city.
 *
 * City is matched against the address, which is stored as
 * "<street>, <city>, <state zip>, <country>" — so `, {city},` is an exact
 * segment match rather than a substring that would let "York" match
 * "New York" or a street name.
 */
export async function getHomeData(rawCity: string): Promise<HomeData> {
  const city = sanitizeSearchTerm(rawCity) || DEFAULT_CITY;
  const sb = createServerClient();

  const { data: cityRestaurants } = await sb
    .from("restaurants")
    .select("id, place_id, name, address, lat, lng")
    .is("deleted_at", null)
    .ilike("address", `*, ${city},*`)
    .limit(CITY_RESTAURANT_CAP);

  const ids = (cityRestaurants ?? []).map((r) => r.id);
  if (ids.length === 0) return { city, lists: [], recentlyTagged: [] };

  const [{ data: tagEvents }, { data: memberships }] = await Promise.all([
    sb
      .from("restaurant_tag")
      .select("restaurant_id, tag_id, created_at")
      .in("restaurant_id", ids)
      .order("created_at", { ascending: false })
      .limit(400),
    sb.from("testmaker_list_restaurant").select("testmaker_list_id, restaurant_id").in("restaurant_id", ids),
  ]);

  // Most recently tagged places, newest first, one entry each.
  const seen = new Set<number>();
  const recentIds: number[] = [];
  for (const e of tagEvents ?? []) {
    if (seen.has(e.restaurant_id)) continue;
    seen.add(e.restaurant_id);
    recentIds.push(e.restaurant_id);
    if (recentIds.length >= 8) break;
  }

  // Tags for just those cards.
  const { data: cardTagRows } = recentIds.length > 0
    ? await sb.from("restaurant_tag").select("restaurant_id, tag_id").in("restaurant_id", recentIds)
    : { data: [] };
  const cardTagIds = [...new Set((cardTagRows ?? []).map((t) => t.tag_id))];
  const { data: cardTagData } = cardTagIds.length > 0
    ? await sb.from("tags").select("id, name").in("id", cardTagIds).is("deleted_at", null)
    : { data: [] };
  const cardTagNames = new Map<number, string>();
  cardTagData?.forEach((t) => cardTagNames.set(t.id, t.name));
  const tagsByRestaurant = buildTagsByRestaurant(cardTagRows ?? [], cardTagNames, 3);

  const byId = new Map((cityRestaurants ?? []).map((r) => [r.id, r]));
  const recentlyTagged: Restaurant[] = recentIds.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    return [{
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
    }];
  });

  // Lists ranked by how much of them sits in this city.
  const hitsByList = new Map<number, number>();
  memberships?.forEach((m) => {
    hitsByList.set(m.testmaker_list_id, (hitsByList.get(m.testmaker_list_id) ?? 0) + 1);
  });
  const topListIds = [...hitsByList.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  let lists: ListSummary[] = [];
  if (topListIds.length > 0) {
    const [{ data: listRows }, { data: sizeRows }] = await Promise.all([
      sb.from("testmaker_list").select("id, list_name, user_id").in("id", topListIds),
      sb.from("testmaker_list_restaurant").select("testmaker_list_id").in("testmaker_list_id", topListIds),
    ]);

    const sizeByList = new Map<number, number>();
    sizeRows?.forEach((s) => {
      sizeByList.set(s.testmaker_list_id, (sizeByList.get(s.testmaker_list_id) ?? 0) + 1);
    });

    const ownerIds = [...new Set((listRows ?? []).map((l) => l.user_id).filter(Boolean))];
    const { data: owners } = ownerIds.length > 0
      ? await sb.from("users").select("id, first_name, last_name, username").in("id", ownerIds)
      : { data: [] };
    const ownerName = new Map<number, string>();
    owners?.forEach((u) => {
      const n = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || (u.username ?? "");
      if (n) ownerName.set(u.id, n);
    });

    const order = new Map(topListIds.map((id, i) => [id, i]));
    lists = (listRows ?? [])
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((l) => {
        const count = sizeByList.get(l.id) ?? 0;
        const places = `${count} ${count === 1 ? "place" : "places"}`;
        const curator = ownerName.get(l.user_id);
        return {
          id: String(l.id),
          slug: buildSlug(l.list_name, l.id),
          title: l.list_name ?? "Untitled list",
          meta: curator ? `${places} · ${curator}` : places,
          thumbnailUrl: coverImage(l.id, 400),
        };
      });
  }

  return { city, lists, recentlyTagged };
}
