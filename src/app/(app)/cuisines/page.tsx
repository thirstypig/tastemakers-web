import type { Metadata } from "next";
import { listCuisines } from "@/features/cuisines/api";
import ListCard from "@/features/lists/ListCard";
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
  title: "Cuisines — Tastemakers",
  description: "Browse restaurants by cuisine.",
  alternates: { canonical: canonical("/cuisines") },
};

export default async function CuisinesPage() {
  const cuisines = await listCuisines();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Cuisines</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
          Ranked by how many places carry them.
        </p>
      </header>

      <div className="tm-listgrid">
        {cuisines.map((c) => (
          <ListCard
            key={c.id}
            href={`/search?q=${encodeURIComponent(c.name)}`}
            title={c.name}
            meta={`${c.placeCount} ${c.placeCount === 1 ? "place" : "places"}`}
            imageUrl={c.imageUrl}
          />
        ))}
      </div>
    </div>
  );
}
