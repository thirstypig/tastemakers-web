import { createServerClient } from "@/lib/supabase-server";
import { voteCountToLevel } from "@/components/tags/tag-utils";
import type { Tastemaker, CuratedList, Restaurant, Tag } from "./types";

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

function coverImage(id: number, w = 800): string {
  const idx = id % FOOD_PHOTOS.length;
  return `https://images.unsplash.com/${FOOD_PHOTOS[idx]}?w=${w}&q=80`;
}

// ── Tag helpers ───────────────────────────────────────────────────────────────

/**
 * Build a per-restaurant map of tags sorted by vote count (popularity).
 * restaurant_tag has one row per user per tag — duplicate (restaurant_id, tag_id)
 * pairs are votes. More votes = higher rank.
 */
function buildTagsByRestaurant(
  tagRows: Array<{ restaurant_id: number; tag_id: number }>,
  tagMap: Map<number, string>,
  maxTagsPerRestaurant = 6,
): Map<number, Tag[]> {
  // Count votes: (restaurant_id, tag_id) → count
  const voteMap = new Map<string, number>();
  for (const r of tagRows) {
    const key = `${r.restaurant_id}:${r.tag_id}`;
    voteMap.set(key, (voteMap.get(key) ?? 0) + 1);
  }

  // Group by restaurant, sorted by vote count desc
  const byRestaurant = new Map<number, Tag[]>();
  for (const [key, count] of [...voteMap.entries()].sort((a, b) => b[1] - a[1])) {
    const [ridStr, tidStr] = key.split(":");
    const rid = Number(ridStr);
    const tid = Number(tidStr);
    const name = tagMap.get(tid);
    if (!name) continue;
    const existing = byRestaurant.get(rid) ?? [];
    if (existing.length < maxTagsPerRestaurant) {
      existing.push({ id: String(tid), name, level: voteCountToLevel(count), count });
      byRestaurant.set(rid, existing);
    }
  }
  return byRestaurant;
}

// ── Address helpers ───────────────────────────────────────────────────────────

function cityFromAddress(address: string | null): string {
  if (!address) return "";
  // "182 Havemeyer St, Brooklyn, NY 11211, United States" → "Brooklyn"
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 3) return parts[parts.length - 3] ?? "";
  if (parts.length >= 2) return parts[parts.length - 2] ?? "";
  return "";
}

function tasteLevel(listCount: number): 1 | 2 | 3 | 4 | 5 {
  if (listCount >= 20) return 5;
  if (listCount >= 10) return 4;
  if (listCount >= 5)  return 3;
  if (listCount >= 2)  return 2;
  return 1;
}

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
      slug: String(l.id),
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
    slug: String(r.id),
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
    slug: String(list.id),
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

export async function listRestaurants(): Promise<Restaurant[]> {
  const sb = createServerClient();

  const { data: tagCounts } = await sb
    .from("restaurant_tag")
    .select("restaurant_id")
    .limit(5000);

  const countMap = new Map<number, number>();
  tagCounts?.forEach((r) => {
    countMap.set(r.restaurant_id, (countMap.get(r.restaurant_id) ?? 0) + 1);
  });

  const topIds = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: restaurants } = await sb
    .from("restaurants")
    .select("id, place_id, name, address, lat, lng")
    .in("id", topIds)
    .is("deleted_at", null);

  if (!restaurants?.length) return [];

  const { data: tagRows } = await sb
    .from("restaurant_tag")
    .select("restaurant_id, tag_id")
    .in("restaurant_id", topIds);

  const tagIds = [...new Set((tagRows ?? []).map((r) => r.tag_id))];
  const { data: tagData } = tagIds.length > 0
    ? await sb.from("tags").select("id, name").in("id", tagIds).is("deleted_at", null)
    : { data: [] };

  const tagMap = new Map<number, string>();
  tagData?.forEach((t) => tagMap.set(t.id, t.name));

  const tagsByRestaurant = buildTagsByRestaurant(tagRows ?? [], tagMap, 4);

  const orderMap = new Map(topIds.map((id, i) => [id, i]));
  return [...restaurants]
    .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    .map((r) => ({
      id: String(r.id),
      slug: String(r.id),
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
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return null;

  const sb = createServerClient();

  const [{ data: r }, { data: tagRows }] = await Promise.all([
    sb.from("restaurants").select("id, place_id, name, address, lat, lng").eq("id", numId).is("deleted_at", null).single(),
    sb.from("restaurant_tag").select("tag_id").eq("restaurant_id", numId),
  ]);

  if (!r) return null;

  const tagIds = [...new Set((tagRows ?? []).map((t) => t.tag_id))];
  const { data: tagData } = tagIds.length > 0
    ? await sb.from("tags").select("id, name").in("id", tagIds).is("deleted_at", null)
    : { data: [] };

  const tagMap = new Map<number, string>();
  tagData?.forEach((t) => tagMap.set(t.id, t.name));
  const tagsByRestaurant = buildTagsByRestaurant(
    (tagRows ?? []).map((t) => ({ restaurant_id: numId, tag_id: t.tag_id })),
    tagMap,
    Infinity, // show every tag ever applied on the detail page
  );
  const tags = tagsByRestaurant.get(numId) ?? [];

  return {
    id: String(r.id),
    slug: String(r.id),
    name: r.name ?? "Unknown",
    address: r.address ?? "",
    neighborhood: cityFromAddress(r.address),
    city: cityFromAddress(r.address),
    cuisine: tags[0]?.name ?? "Restaurant",
    imageUrl: coverImage(r.id),
    tags,
    foursquareId: r.place_id ?? undefined,
    latitude: r.lat ? parseFloat(r.lat) : undefined,
    longitude: r.lng ? parseFloat(r.lng) : undefined,
  };
}

// ── Tastemakers ───────────────────────────────────────────────────────────────

export async function listTastemakers(): Promise<Tastemaker[]> {
  const sb = createServerClient();

  const { data: users } = await sb
    .from("users")
    .select("id, first_name, last_name, username, short_description, instagram, image")
    .eq("is_testmaker", 1)
    .is("deleted_at", null);

  if (!users?.length) return [];

  const userIds = users.map((u) => u.id);

  const [{ data: allLists }, { data: tagRows }] = await Promise.all([
    sb.from("testmaker_list").select("id, list_name, user_id").in("user_id", userIds).order("created_at", { ascending: false }),
    sb.from("restaurant_tag").select("user_id").in("user_id", userIds),
  ]);

  const listsByUser = new Map<number, Array<{ id: number; list_name: string | null; user_id: number }>>();
  allLists?.forEach((l) => {
    const existing = listsByUser.get(l.user_id) ?? [];
    existing.push(l);
    listsByUser.set(l.user_id, existing);
  });

  const tagCountByUser = new Map<number, number>();
  tagRows?.forEach((r) => {
    tagCountByUser.set(r.user_id, (tagCountByUser.get(r.user_id) ?? 0) + 1);
  });

  return users.map((u) => {
    const userLists = listsByUser.get(u.id) ?? [];
    const listCount = userLists.length;
    const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username || "Tastemaker";
    const slug = u.username ?? String(u.id);

    return {
      id: String(u.id),
      slug,
      name,
      username: u.username ?? slug,
      bio: u.short_description ?? "",
      avatarUrl: coverImage(u.id + 100, 400),
      location: "",
      followerCount: tagCountByUser.get(u.id) ?? 0,
      listCount,
      level: tasteLevel(listCount),
      lists: userLists.slice(0, 4).map((l) => ({
        id: String(l.id),
        slug: String(l.id),
        title: l.list_name ?? "Untitled",
        description: "",
        coverImageUrl: coverImage(l.id),
        restaurantCount: 0,
        restaurants: [],
        createdAt: "",
      })),
      tags: [],
    };
  });
}

export async function getTastemaker(slug: string): Promise<Tastemaker | null> {
  const tastemakers = await listTastemakers();
  return tastemakers.find((t) => t.slug === slug || t.id === slug) ?? null;
}

export type { Tastemaker, CuratedList, Restaurant };
