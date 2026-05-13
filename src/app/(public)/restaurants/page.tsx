import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listRestaurants } from "@/lib/api/index";
import type { Restaurant, Tag } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Restaurants — Tastemakers",
  description:
    "Restaurants discovered and tagged by NYC's most trusted food curators. Every place means something to someone who knows their food.",
  alternates: { canonical: "https://app.tastemakersapp.com/restaurants" },
};

const TAG_BG: Record<number, string>   = { 1: "#3D296E", 2: "#594094", 3: "#876DC4", 4: "#9B82D4", 5: "#EFE8FE" };
const TAG_TEXT: Record<number, string> = { 1: "#B7ADCF", 2: "#EFE8FE", 3: "#fff",    4: "#fff",    5: "#2A1A60" };

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants();

  return (
    <>
      <section
        style={{
          background: "linear-gradient(180deg, #3D296E 0%, #1A1038 100%)",
          padding: "72px 24px 64px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.03em",
            marginBottom: 16,
          }}
        >
          Restaurants
        </h1>
        <p style={{ fontSize: 18, color: "#B7ADCF", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Discovered and tagged by people who eat seriously.
        </p>
      </section>

      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </section>
    </>
  );
}

function RestaurantCard({ restaurant: r }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurants/${r.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        className="pub-card"
        style={{
          background: "#2A1A60",
          borderRadius: 16,
          border: "1px solid #3D2E6E",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative", height: 180 }}>
          <Image src={r.imageUrl} alt={r.name} fill priority sizes="(max-width: 1100px) 33vw, 350px" style={{ objectFit: "cover" }} />
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
            {r.name}
          </h2>
          <p style={{ fontSize: 13, color: "#8b81a3", margin: "0 0 12px" }}>
            {r.neighborhood} · {r.cuisine}
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {r.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                style={{
                  background: TAG_BG[tag.level] ?? "#3D296E",
                  color: TAG_TEXT[tag.level] ?? "#B7ADCF",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: 4,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
