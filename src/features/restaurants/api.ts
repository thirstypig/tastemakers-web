import { cache } from "react";
import { createServerClient } from "@/lib/supabase-server";
import {
  buildTagsByRestaurant,
  cityFromAddress,
  coverImage,
  fetchAllPages,
} from "@/lib/api/shared";
import { buildSlug } from "@/lib/slug";
import type {
  Restaurant,
  RestaurantDetail,
  RestaurantPhoto,
  ListSummary,
} from "@/lib/api/types";

// ── Restaurants ───────────────────────────────────────────────────────────────

/** How many restaurants the index and generateStaticParams cover. */
export const LISTING_SIZE = 60;

export async function listRestaurants(): Promise<Restaurant[]> {
  const sb = createServerClient();

  // Every tag row, not the first page of them. `.limit(5000)` returned 1000
  // (PostgREST's cap), so the ranking below was computed from a quarter of the
  // table and surfaced the wrong restaurants — silently (todo 090).
  const tagCounts = await fetchAllPages<{ restaurant_id: number }>(async (from, to) => {
    const { data } = await sb
      .from("restaurant_tag")
      .select("restaurant_id")
      .order("id", { ascending: true })
      .range(from, to);
    return data;
  });

  const countMap = new Map<number, number>();
  tagCounts.forEach((r) => {
    countMap.set(r.restaurant_id, (countMap.get(r.restaurant_id) ?? 0) + 1);
  });

  const topIds = [...countMap.entries()]
    // Tie-break on id so the ranking is stable between builds; without it,
    // equal-count restaurants shuffle and prerendered pages churn.
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, LISTING_SIZE)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: restaurants } = await sb
    .from("restaurants")
    .select("id, place_id, name, address, lat, lng")
    .in("id", topIds)
    .is("deleted_at", null);

  if (!restaurants?.length) return [];

  // `.in(...)` bounds this to the top 60, so it is not the unbounded read of
  // todo 090 — but the bound is data-dependent, not structural. Measured against
  // production 2026-08-19: 848 rows against the 1000 cap, 15% headroom, and the
  // same 848 the finding recorded a day earlier. The density lands
  // disproportionately here because the top 60 are the restaurants people
  // actually tag, so any re-engagement or a tag-seeding backfill (backend todos
  // 033-035) crosses it — and the failure is invisible: the page renders, the
  // tag clouds are just missing rows (todo 122).
  const tagRows = await fetchAllPages<{ restaurant_id: number; tag_id: number }>(async (from, to) => {
    const { data } = await sb
      .from("restaurant_tag")
      .select("restaurant_id, tag_id")
      .in("restaurant_id", topIds)
      .order("id", { ascending: true })
      .range(from, to);
    return data;
  });

  // 285 distinct tags across the top 60 today, so this is far from the cap —
  // paged for the same reason `categories` is in features/cuisines: "under the
  // cap right now" is not a property the code states or enforces.
  const tagIds = [...new Set(tagRows.map((r) => r.tag_id))];
  const tagData = tagIds.length > 0
    ? await fetchAllPages<{ id: number; name: string }>(async (from, to) => {
        const { data } = await sb
          .from("tags")
          .select("id, name")
          .in("id", tagIds)
          .is("deleted_at", null)
          .order("id", { ascending: true })
          .range(from, to);
        return data;
      })
    : [];

  const tagMap = new Map<number, string>();
  tagData.forEach((t) => tagMap.set(t.id, t.name));

  const tagsByRestaurant = buildTagsByRestaurant(tagRows, tagMap, 4);

  const orderMap = new Map(topIds.map((id, i) => [id, i]));
  return [...restaurants]
    .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
    .map((r) => ({
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
    slug: buildSlug(r.name, r.id),
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

/**
 * The restaurant detail page's data, in one pass.
 *
 * Deliberately does NOT call listLists(): that scans every list, every
 * membership row and the entire users table on a page that only needs the
 * lists containing one restaurant (todo 091). The membership lookup here is
 * keyed on restaurant_id and bounded by it.
 */
/**
 * Deduped per request with React's `cache()`.
 *
 * Next calls `generateMetadata` and the page component separately, and both fetch
 * the same record — and this function issues four Supabase queries, so the detail
 * page was paying eight round trips to render one restaurant.
 *
 * `cache()` is per-render, not a TTL cache: it holds nothing between requests, so
 * it cannot serve stale data to anyone. Purely removing a duplicate.
 */
export const getRestaurantDetail = cache(
  async (id: string): Promise<RestaurantDetail | null> => {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return null;

  const sb = createServerClient();

  const [{ data: r }, { data: tagRows }, { data: imageRows }, { data: memberRows }] =
    await Promise.all([
      sb
        .from("restaurants")
        .select("id, place_id, name, address, lat, lng, website, contact")
        .eq("id", numId)
        .is("deleted_at", null)
        .single(),
      sb.from("restaurant_tag").select("tag_id").eq("restaurant_id", numId),
      sb.from("restaurant_images").select("id, image").eq("restaurant_id", numId),
      sb.from("testmaker_list_restaurant").select("testmaker_list_id").eq("restaurant_id", numId),
    ]);

  if (!r) return null;

  const tagIds = [...new Set((tagRows ?? []).map((t) => t.tag_id))];
  const { data: tagData } = tagIds.length > 0
    ? await sb.from("tags").select("id, name").in("id", tagIds).is("deleted_at", null)
    : { data: [] };

  const tagMap = new Map<number, string>();
  tagData?.forEach((t) => tagMap.set(t.id, t.name));
  const tags =
    buildTagsByRestaurant(
      (tagRows ?? []).map((t) => ({ restaurant_id: numId, tag_id: t.tag_id })),
      tagMap,
      Infinity, // show every tag ever applied on the detail page
    ).get(numId) ?? [];

  // Only the lists this restaurant is actually on, plus their sizes.
  const listIds = [...new Set((memberRows ?? []).map((m) => m.testmaker_list_id))];
  let onLists: ListSummary[] = [];
  if (listIds.length > 0) {
    // NB: testmaker_list has no deleted_at column — filtering on one here
    // makes PostgREST return nothing and the rail silently disappears.
    const [{ data: lists }, { data: sizeRows }] = await Promise.all([
      sb.from("testmaker_list").select("id, list_name, user_id").in("id", listIds),
      sb.from("testmaker_list_restaurant").select("testmaker_list_id").in("testmaker_list_id", listIds),
    ]);

    const sizeByList = new Map<number, number>();
    sizeRows?.forEach((s) => {
      sizeByList.set(s.testmaker_list_id, (sizeByList.get(s.testmaker_list_id) ?? 0) + 1);
    });

    // Curator names, bounded by the owners of just these lists.
    const ownerIds = [...new Set((lists ?? []).map((l) => l.user_id).filter(Boolean))];
    const { data: owners } = ownerIds.length > 0
      ? await sb.from("users").select("id, first_name, last_name, username").in("id", ownerIds)
      : { data: [] };

    const ownerMap = new Map<number, string>();
    owners?.forEach((u) => {
      const name =
        `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || (u.username ?? "");
      if (name) ownerMap.set(u.id, name);
    });

    onLists = (lists ?? []).map((l) => {
      const count = sizeByList.get(l.id) ?? 0;
      const places = `${count} ${count === 1 ? "place" : "places"}`;
      const curator = ownerMap.get(l.user_id);
      return {
        id: String(l.id),
        slug: buildSlug(l.list_name, l.id),
        title: l.list_name ?? "Untitled list",
        meta: curator ? `${places} · ${curator}` : places,
        thumbnailUrl: coverImage(l.id, 120),
      };
    });
  }

  const website = r.website?.trim() ?? "";
  const phone = r.contact?.trim() ?? "";

  return {
    id: String(r.id),
    slug: buildSlug(r.name, r.id),
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
    phone: phone || undefined,
    website: website || undefined,
    photos: (imageRows ?? [])
      .filter((i) => i.image)
      // The column holds a bare filename, not a URL — resolve it against the
      // API host or next/image gets a relative path that 404s.
      .map((i) => ({ id: String(i.id), url: restaurantImageUrl(String(i.image)) })),
    onLists,
  };
})

/**
 * Absolute URL for a row in restaurant_images.
 *
 * The backend stores a bare filename and serves it from Laravel's public dir
 * (`$image->move(public_path('storage/res_image'), …)`), so the URL is built
 * from the API host, not the web app's. Values that already look absolute are
 * passed through, in case the storage path ever changes.
 */
export function restaurantImageUrl(image: string): string {
  if (/^https?:\/\//i.test(image)) return image;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://api.tastemakersapp.com/api";
  const host = apiBase.replace(/\/api\/?$/, "");
  return `${host}/storage/res_image/${image.replace(/^\/+/, "")}`;
}

/** Photos for one restaurant, most-hearted first. */
export async function getRestaurantPhotos(id: string): Promise<RestaurantPhoto[]> {
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return [];

  const sb = createServerClient();

  const { data: imageRows } = await sb
    .from("restaurant_images")
    .select("id, image")
    .eq("restaurant_id", numId);

  const images = (imageRows ?? []).filter((i) => i.image);
  if (images.length === 0) return [];

  // is_like is a smallint flag — an unliked row can exist, so count only 1s.
  const { data: likeRows } = await sb
    .from("imagelike")
    .select("image_id")
    .in("image_id", images.map((i) => i.id))
    .eq("is_like", 1);

  const heartsByImage = new Map<number, number>();
  likeRows?.forEach((l) => {
    heartsByImage.set(l.image_id, (heartsByImage.get(l.image_id) ?? 0) + 1);
  });

  return images
    .map((i) => ({
      id: String(i.id),
      url: restaurantImageUrl(String(i.image)),
      hearts: heartsByImage.get(i.id) ?? 0,
    }))
    .sort((a, b) => b.hearts - a.hearts);
}
