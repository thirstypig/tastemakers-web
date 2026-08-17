import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { coverImage } from "@/lib/api/shared";
import { buildSlug } from "@/lib/slug";

function db() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * GET /api/me/summary — everything the profile and bookmarks screens need.
 *
 * One route rather than two because both need the same identity lookup and
 * the payload is small.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUserId = user.user_metadata?.app_user_id as number | undefined;
  if (!appUserId) return NextResponse.json({ error: "User not synced" }, { status: 403 });

  const sb = db();

  const [
    { data: myTagRows },
    { data: savedRestaurants },
    { data: savedLists },
    { data: badgeRows },
    { data: profile },
  ] = await Promise.all([
    sb.from("restaurant_tag").select("restaurant_id, tag_id, created_at").eq("user_id", appUserId),
    sb.from("restaurant_user").select("restaurant_id").eq("user_id", appUserId),
    sb.from("bookmark_testmaker_list").select("testmaker_list_id").eq("user_id", appUserId),
    sb.from("badge_categories").select("category_id, category_name, badge_image, grey_badge_image"),
    sb.from("users").select("id, first_name, last_name, username, image").eq("id", appUserId).maybeSingle(),
  ]);

  const tagRows = myTagRows ?? [];
  const placeIds = [...new Set(tagRows.map((t) => t.restaurant_id))];
  const tagIds = [...new Set(tagRows.map((t) => t.tag_id))];

  // Names for the user's own recent tags.
  const { data: tagNames } = tagIds.length > 0
    ? await sb.from("tags").select("id, name").in("id", tagIds).is("deleted_at", null)
    : { data: [] };
  const nameById = new Map((tagNames ?? []).map((t) => [t.id, t.name]));

  const recentTags = [...tagRows]
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .slice(0, 12)
    .flatMap((t) => {
      const name = nameById.get(t.tag_id);
      return name ? [{ id: String(t.tag_id), name }] : [];
    });

  // Bookmarked restaurants.
  const savedIds = (savedRestaurants ?? []).map((r) => r.restaurant_id);
  const { data: savedRows } = savedIds.length > 0
    ? await sb.from("restaurants").select("id, name, address").in("id", savedIds).is("deleted_at", null)
    : { data: [] };

  // Bookmarked lists.
  const savedListIds = (savedLists ?? []).map((l) => l.testmaker_list_id);
  const { data: savedListRows } = savedListIds.length > 0
    ? await sb.from("testmaker_list").select("id, list_name").in("id", savedListIds)
    : { data: [] };
  const { data: listSizes } = savedListIds.length > 0
    ? await sb.from("testmaker_list_restaurant").select("testmaker_list_id").in("testmaker_list_id", savedListIds)
    : { data: [] };
  const sizeByList = new Map<number, number>();
  listSizes?.forEach((s) => {
    sizeByList.set(s.testmaker_list_id, (sizeByList.get(s.testmaker_list_id) ?? 0) + 1);
  });

  const displayName =
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
    profile?.username ||
    user.email ||
    "You";

  return NextResponse.json({
    name: displayName,
    stats: {
      tags: tagRows.length,
      places: placeIds.length,
      badges: 0,
    },
    recentTags,
    // badge_categories is empty in production, so this is [] — the UI says so
    // rather than inventing a badge system.
    badges: (badgeRows ?? []).map((b) => ({
      id: String(b.category_id),
      name: b.category_name,
    })),
    bookmarks: {
      restaurants: (savedRows ?? []).map((r) => ({
        id: String(r.id),
        slug: buildSlug(r.name, r.id),
        name: r.name ?? "Unknown",
        address: r.address ?? "",
        imageUrl: coverImage(r.id, 300),
      })),
      lists: (savedListRows ?? []).map((l) => {
        const count = sizeByList.get(l.id) ?? 0;
        return {
          id: String(l.id),
          slug: buildSlug(l.list_name, l.id),
          title: l.list_name ?? "Untitled list",
          meta: `${count} ${count === 1 ? "place" : "places"}`,
          thumbnailUrl: coverImage(l.id, 300),
        };
      }),
    },
  });
}
