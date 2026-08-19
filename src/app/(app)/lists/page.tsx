import type { Metadata } from "next";
import { listLists } from "@/features/lists/api";
import ListCard from "@/features/lists/ListCard";
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
  title: "Lists — Tastemakers",
  description: "Curated restaurant lists from the people who tagged them.",
  alternates: { canonical: canonical("/lists") },
};

export default async function ListsPage() {
  const lists = await listLists();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Lists</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
          {lists.length} curated {lists.length === 1 ? "list" : "lists"}.
        </p>
      </header>

      <div className="tm-listgrid">
        {lists.map((l) => (
          <ListCard
            key={l.id}
            href={`/lists/${l.slug}`}
            title={l.title}
            meta={`${l.restaurantCount} ${l.restaurantCount === 1 ? "place" : "places"}${l.curatorName ? ` · ${l.curatorName}` : ""}`}
            imageUrl={l.coverImageUrl}
          />
        ))}
      </div>

      <AdUnit slot={AD_SLOTS.restaurantsFeed} />
    </div>
  );
}
