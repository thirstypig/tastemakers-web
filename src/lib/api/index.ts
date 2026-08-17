import { createServerClient } from "@/lib/supabase-server";
import { buildTagsByRestaurant, cityFromAddress, coverImage, tasteLevel } from "./shared";
import { buildSlug } from "@/lib/slug";
import type { Tastemaker, CuratedList, Restaurant, Tag } from "./types";

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
        slug: buildSlug(l.list_name, l.id),
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
  const sb = createServerClient();

  // Try username match first, then numeric id
  const numId = parseInt(slug, 10);
  const { data: user } = isNaN(numId)
    ? await sb.from("users").select("id, first_name, last_name, username, short_description, instagram, image").eq("username", slug).eq("is_testmaker", 1).is("deleted_at", null).single()
    : await sb.from("users").select("id, first_name, last_name, username, short_description, instagram, image").eq("id", numId).eq("is_testmaker", 1).is("deleted_at", null).single();

  if (!user) return null;

  const [{ data: userLists }, { data: tagRows }] = await Promise.all([
    sb.from("testmaker_list").select("id, list_name").eq("user_id", user.id).order("created_at", { ascending: false }),
    sb.from("restaurant_tag").select("user_id").eq("user_id", user.id),
  ]);

  const listIds = (userLists ?? []).map((l) => l.id);
  const { data: listRestaurants } = listIds.length > 0
    ? await sb.from("testmaker_list_restaurant").select("testmaker_list_id").in("testmaker_list_id", listIds)
    : { data: [] };

  const countMap = new Map<number, number>();
  listRestaurants?.forEach((r) => {
    countMap.set(r.testmaker_list_id, (countMap.get(r.testmaker_list_id) ?? 0) + 1);
  });

  const listCount = userLists?.length ?? 0;
  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username || "Tastemaker";
  const userSlug = user.username ?? String(user.id);

  return {
    id: String(user.id),
    slug: userSlug,
    name,
    username: user.username ?? userSlug,
    bio: user.short_description ?? "",
    avatarUrl: coverImage(user.id + 100, 400),
    location: "",
    followerCount: tagRows?.length ?? 0,
    listCount,
    level: tasteLevel(listCount),
    lists: (userLists ?? []).map((l) => ({
      id: String(l.id),
      slug: buildSlug(l.list_name, l.id),
      title: l.list_name ?? "Untitled",
      description: "",
      coverImageUrl: coverImage(l.id),
      restaurantCount: countMap.get(l.id) ?? 0,
      restaurants: [],
      createdAt: "",
    })),
    tags: [],
  };
}

export type { Tastemaker, CuratedList, Restaurant };
