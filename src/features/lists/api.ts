import { createServerClient } from "@/lib/supabase-server";
import { buildTagsByRestaurant, cityFromAddress, coverImage } from "@/lib/api/shared";
import { buildSlug } from "@/lib/slug";
import type { CuratedList, Restaurant } from "@/lib/api/types";

// ── Lists ─────────────────────────────────────────────────────────────────────

export async function listLists(): Promise<CuratedList[]> {
  const sb = createServerClient();

  const [{ data: lists }, { data: counts }, { data: users }] = await Promise.all([
    sb.from("testmaker_list").select("id, list_name, image, created_at, user_id").order("created_at", { ascending: false }),
    sb.from("testmaker_list_restaurant").select("testmaker_list_id"),
    sb.from("users").select("id, first_name, last_name, username"),
  ]);

  const countMap = new Map<number, number>();
  counts?.forEach((c) => {
    countMap.set(c.testmaker_list_id, (countMap.get(c.testmaker_list_id) ?? 0) + 1);
  });

  const userMap = new Map<number, { first_name: string; last_name: string; username: string | null }>();
  users?.forEach((u) => userMap.set(u.id, u));

  return (lists ?? []).map((l) => {
    const curator = userMap.get(l.user_id);
    const curatorName = curator
      ? `${curator.first_name ?? ""} ${curator.last_name ?? ""}`.trim() || curator.username || undefined
      : undefined;
    return {
      id: String(l.id),
      slug: buildSlug(l.list_name, l.id),
      title: l.list_name ?? "Untitled List",
      description: "",
      coverImageUrl: coverImage(l.id),
      restaurantCount: countMap.get(l.id) ?? 0,
      restaurants: [],
      createdAt: l.created_at ?? "",
      curatorName,
    };
  });
}

export async function getList(slug: string): Promise<CuratedList | null> {
  const id = parseInt(slug, 10);
  if (isNaN(id)) return null;

  const sb = createServerClient();

  const [{ data: list }, { data: listRestaurants }] = await Promise.all([
    sb.from("testmaker_list").select("id, list_name, image, created_at, user_id").eq("id", id).single(),
    sb.from("testmaker_list_restaurant").select("restaurant_id").eq("testmaker_list_id", id),
  ]);

  if (!list) return null;

  const restaurantIds = (listRestaurants ?? []).map((r) => r.restaurant_id);

  const [{ data: restaurants }, { data: curator }] = await Promise.all([
    restaurantIds.length > 0
      ? sb.from("restaurants").select("id, place_id, name, address, lat, lng").in("id", restaurantIds).is("deleted_at", null)
      : Promise.resolve({ data: [] }),
    sb.from("users").select("id, first_name, last_name, username").eq("id", list.user_id).single(),
  ]);

  const orderMap = new Map(restaurantIds.map((rid, i) => [rid, i]));
  const sortedRestaurants = [...(restaurants ?? [])].sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
  );

  const tagRows = restaurantIds.length > 0
    ? await sb.from("restaurant_tag").select("restaurant_id, tag_id").in("restaurant_id", restaurantIds)
    : { data: [] };

  const tagIds = [...new Set((tagRows.data ?? []).map((r) => r.tag_id))];
  const { data: tagData } = tagIds.length > 0
    ? await sb.from("tags").select("id, name").in("id", tagIds).is("deleted_at", null)
    : { data: [] };

  const tagMap = new Map<number, string>();
  tagData?.forEach((t) => tagMap.set(t.id, t.name));

  const tagsByRestaurant = buildTagsByRestaurant(tagRows.data ?? [], tagMap);

  const curatorName = curator
    ? `${curator.first_name ?? ""} ${curator.last_name ?? ""}`.trim() || curator.username || undefined
    : undefined;

  const mappedRestaurants: Restaurant[] = sortedRestaurants.map((r) => ({
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

  return {
    id: String(list.id),
    slug: buildSlug(list.list_name, list.id),
    title: list.list_name ?? "Untitled List",
    description: "",
    coverImageUrl: coverImage(list.id),
    restaurantCount: restaurantIds.length,
    restaurants: mappedRestaurants,
    createdAt: list.created_at ?? "",
    curatorName,
  };
}

// ── Restaurants ───────────────────────────────────────────────────────────────
