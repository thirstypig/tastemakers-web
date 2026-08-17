import type { Metadata } from "next";
import { listCuisines } from "@/features/cuisines/api";
import ListCard from "@/features/lists/ListCard";

export const metadata: Metadata = {
  title: "Cuisines — Tastemakers",
  description: "Browse restaurants by cuisine.",
  alternates: { canonical: "https://app.tastemakersapp.com/cuisines" },
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
