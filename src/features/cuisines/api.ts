import { createServerClient } from "@/lib/supabase-server";
import { coverImage, fetchAllPages } from "@/lib/api/shared";

export interface Cuisine {
  id: string;
  name: string;
  placeCount: number;
  imageUrl: string;
}

/** Cuisines that actually have restaurants, most places first. */
export async function listCuisines(limit = 40): Promise<Cuisine[]> {
  const sb = createServerClient();

  // Both reads are paged. PostgREST caps a response at 1,000 rows and reports no
  // error, so an unranged read of `category_restaurant` (1,572 rows in
  // production) dropped 36% of the join table — and `placeCount` below is not
  // just displayed, it is the sort key, so the ordering was wrong too. Nothing
  // surfaced it: the page rendered normally with plausible numbers (todo 090).
  //
  // `categories` is only 374 rows today, comfortably under the cap. It is paged
  // anyway because "under the cap right now" is not a property the code states
  // or enforces, and this is the second table to cross that line unnoticed.
  const [categories, links] = await Promise.all([
    fetchAllPages<{ id: number; title: string | null }>(async (from, to) => {
      const { data } = await sb.from("categories").select("id, title").range(from, to);
      return data;
    }),
    fetchAllPages<{ category_id: number; restaurant_id: number }>(async (from, to) => {
      const { data } = await sb
        .from("category_restaurant")
        .select("category_id, restaurant_id")
        .range(from, to);
      return data;
    }),
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
