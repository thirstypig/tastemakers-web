import { createServerClient } from "@/lib/supabase-server";
import { coverImage } from "@/lib/api/shared";

export interface Cuisine {
  id: string;
  name: string;
  placeCount: number;
  imageUrl: string;
}

/** Cuisines that actually have restaurants, most places first. */
export async function listCuisines(limit = 40): Promise<Cuisine[]> {
  const sb = createServerClient();

  const [{ data: categories }, { data: links }] = await Promise.all([
    sb.from("categories").select("id, title"),
    sb.from("category_restaurant").select("category_id, restaurant_id"),
  ]);

  // Distinct restaurants per category — the join table has duplicates.
  const placesByCategory = new Map<number, Set<number>>();
  links?.forEach((l) => {
    const set = placesByCategory.get(l.category_id) ?? new Set<number>();
    set.add(l.restaurant_id);
    placesByCategory.set(l.category_id, set);
  });

  return (categories ?? [])
    .map((c) => ({
      id: String(c.id),
      name: c.title ?? "Unknown",
      placeCount: placesByCategory.get(c.id)?.size ?? 0,
      imageUrl: coverImage(c.id, 400),
    }))
    .filter((c) => c.placeCount > 0)
    .sort((a, b) => b.placeCount - a.placeCount)
    .slice(0, limit);
}
