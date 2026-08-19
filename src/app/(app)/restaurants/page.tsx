import type { Metadata } from "next";
import { listRestaurants } from "@/features/restaurants/api";
import ResultCard from "@/features/restaurants/ResultCard";
import { AdUnit } from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import { canonical } from "@/lib/site";


/**
 * Regenerate at most once a minute rather than querying Supabase per request.
 *
 * This is a read-only catalogue view over data that changes rarely — production
 * tagging is down 98.5% and the newest tag is from 2025 — so a 60s window is
 * invisible to a visitor and removes almost all of the database load behind the
 * SEO-indexed surface. Every public page previously had NO revalidate at all
 * (TODO-094).
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Restaurants — Tastemakers",
  description:
    "Restaurants tagged by the people who ate there. Reviews in words, not stars.",
  alternates: { canonical: canonical("/restaurants") },
};

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Restaurants</h1>
        {/* listRestaurants() returns the most-tagged N, not the whole table
            (1,388 rows) — say so rather than pass a cap off as a total.
            Pagination is todo 090. */}
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
          The {restaurants.length} most-tagged places. Search to find anywhere else.
        </p>
      </header>

      <div className="tm-results">
        {restaurants.map((r) => (
          <ResultCard key={r.id} restaurant={r} />
        ))}
      </div>

      <AdUnit slot={AD_SLOTS.restaurantsFeed} />
    </div>
  );
}
