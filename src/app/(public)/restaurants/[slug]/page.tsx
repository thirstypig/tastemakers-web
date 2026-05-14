import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { getRestaurant, listRestaurants, listTastemakers, listLists } from "@/lib/api/index";
import type { Restaurant, CuratedList } from "@/lib/api/types";
import TagCloud from "@/components/tags/TagCloud";
import { TagReview } from "@/components/tags/TagReview";

const SITE_URL = "https://app.tastemakersapp.com";

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const restaurants = await listRestaurants();
  return restaurants.map((r) => ({ slug: r.slug }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRestaurant(slug);
  if (!r) return { title: "Not Found" };

  const url = `${SITE_URL}/restaurants/${r.slug}`;
  const description = `${r.cuisine} in ${r.neighborhood}, ${r.city}. Discover what tastemakers say about ${r.name}.`;

  return {
    title: `${r.name} — Tastemakers`,
    description,
    openGraph: {
      title: r.name,
      description,
      url,
      type: "article",
      images: [{ url: r.imageUrl, width: 800, height: 600, alt: r.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: r.name,
      description,
      images: [r.imageUrl],
    },
    alternates: { canonical: url },
  };
}

// ── JSON-LD ────────────────────────────────────────────────────────────────────

function buildRestaurantSchema(r: Restaurant): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    servesCuisine: r.cuisine,
    image: r.imageUrl,
    url: `${SITE_URL}/restaurants/${r.slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: r.address,
      addressLocality: r.neighborhood,
      addressRegion: r.city,
    },
    ...(r.latitude && r.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: r.latitude,
            longitude: r.longitude,
          },
        }
      : {}),
    keywords: r.tags.map((t) => t.name).join(", "),
  };

  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}


// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [restaurant, allLists] = await Promise.all([
    getRestaurant(slug),
    listLists(),
  ]);
  if (!restaurant) notFound();

  // Find which lists include this restaurant
  const appearsIn = allLists.filter((l) =>
    l.restaurants.some((r) => r.slug === restaurant.slug)
  );

  const schema = buildRestaurantSchema(restaurant);

  return (
    <>
      <Script id="restaurant-schema" type="application/ld+json" strategy="beforeInteractive">
        {schema}
      </Script>

      {/* Hero — split layout: image left, info right */}
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          alignItems: "start",
        }}
      >
        {/* Image */}
        <div style={{ borderRadius: 16, overflow: "hidden", lineHeight: 0 }}>
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            width={800}
            height={520}
            priority
            style={{ objectFit: "cover", width: "100%", height: "auto" }}
          />
        </div>

        {/* Info */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ marginBottom: 16 }}>
            <Link
              href="/restaurants"
              style={{ color: "#8b81a3", fontSize: 13, textDecoration: "none" }}
            >
              Restaurants
            </Link>
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.03em",
              marginBottom: 8,
              lineHeight: 1.1,
            }}
          >
            {restaurant.name}
          </h1>

          <p style={{ fontSize: 16, color: "#8b81a3", marginBottom: 24 }}>
            {restaurant.cuisine} · {restaurant.neighborhood} · {restaurant.city}
          </p>

          <address
            style={{
              fontSize: 14,
              color: "#B7ADCF",
              fontStyle: "normal",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ color: "#DB1657" }}>📍</span>
            {restaurant.address}, {restaurant.city}
          </address>

          {/* Tags */}
          {restaurant.tags.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#8b81a3",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Known for
              </p>
              <TagCloud tags={restaurant.tags} />
              <TagReview restaurantId={restaurant.id} initialTags={restaurant.tags} />
            </div>
          )}

          {/* Map placeholder */}
          <div
            style={{
              borderRadius: 12,
              border: "1px dashed #3D2E6E",
              padding: "24px",
              textAlign: "center",
              color: "#8b81a3",
              fontSize: 13,
            }}
          >
            📍 Map coming soon
          </div>
        </div>
      </section>

      {/* Featured in lists */}
      {appearsIn.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 80px" }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: 24,
            }}
          >
            Featured in
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {appearsIn.map((list) => (
              <FeaturedListCard key={list.id} list={list} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FeaturedListCard({ list }: { list: CuratedList }) {
  return (
    <Link href={`/lists/${list.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        className="pub-card"
        style={{
          background: "#2A1A60",
          borderRadius: 12,
          border: "1px solid #3D2E6E",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        <div style={{ position: "relative", height: 140 }}>
          <Image
            src={list.coverImageUrl}
            alt={list.title}
            fill
            sizes="(max-width: 1100px) 50vw, 350px"
            style={{ objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(42,26,96,0.9) 0%, transparent 60%)",
            }}
          />
        </div>
        <div style={{ padding: "14px 16px 16px" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
            {list.title}
          </p>
          <p style={{ fontSize: 12, color: "#8b81a3", margin: 0 }}>
            {list.restaurantCount} spots
          </p>
        </div>
      </article>
    </Link>
  );
}
