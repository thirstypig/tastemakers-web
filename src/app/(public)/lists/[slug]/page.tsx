import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { getList, listLists } from "@/lib/api/index";
import type { CuratedList, Restaurant } from "@/lib/api/types";
import TagCloud from "@/components/tags/TagCloud";

const SITE_URL = "https://app.tastemakersapp.com";

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const lists = await listLists();
  return lists.map((l) => ({ slug: l.slug }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const list = await getList(slug);
  if (!list) return { title: "Not Found" };

  const url = `${SITE_URL}/lists/${list.slug}`;

  return {
    title: `${list.title} — Tastemakers`,
    description: list.description,
    openGraph: {
      title: list.title,
      description: list.description,
      url,
      type: "article",
      images: [{ url: list.coverImageUrl, width: 1200, height: 630, alt: list.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: list.title,
      description: list.description,
      images: [list.coverImageUrl],
    },
    alternates: { canonical: url },
  };
}

// ── JSON-LD ────────────────────────────────────────────────────────────────────

function buildItemListSchema(list: CuratedList): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.description,
    url: `${SITE_URL}/lists/${list.slug}`,
    numberOfItems: list.restaurantCount,
    ...(list.curatorName ? { author: { "@type": "Person", name: list.curatorName } } : {}),
    itemListElement: list.restaurants.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.name,
      url: `${SITE_URL}/restaurants/${r.slug}`,
      item: {
        "@type": "Restaurant",
        name: r.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: r.address,
          addressLocality: r.city,
        },
        servesCuisine: r.cuisine,
      },
    })),
  };

  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}


// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const list = await getList(slug);
  if (!list) notFound();

  const schema = buildItemListSchema(list);

  return (
    <>
      <Script id="list-schema" type="application/ld+json" strategy="beforeInteractive">
        {schema}
      </Script>

      {/* Hero */}
      <section style={{ position: "relative", minHeight: 340 }}>
        {/* Cover image with dark overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src={list.coverImageUrl}
            alt={list.title}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(26,16,56,0.6) 0%, rgba(26,16,56,0.92) 60%, #1A1038 100%)",
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 860,
            margin: "0 auto",
            padding: "72px 24px 56px",
          }}
        >
          {/* Breadcrumb */}
          <div style={{ marginBottom: 20 }}>
            <Link href="/lists" style={{ color: "#8b81a3", fontSize: 13, textDecoration: "none" }}>
              Lists
            </Link>
          </div>

          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 52px)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.03em",
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            {list.title}
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#B7ADCF",
              lineHeight: 1.7,
              maxWidth: 580,
              marginBottom: 28,
            }}
          >
            {list.description}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <span
              style={{
                background: "rgba(219,22,87,0.15)",
                border: "1px solid rgba(219,22,87,0.4)",
                color: "#DB1657",
                fontSize: 13,
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: 20,
              }}
            >
              {list.restaurantCount} spots
            </span>

            {list.curatorName && (
              <span style={{ color: "#B7ADCF", fontSize: 14 }}>
                curated by <strong style={{ color: "#fff" }}>{list.curatorName}</strong>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Restaurant list */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {list.restaurants.map((restaurant, i) => (
            <RestaurantRow key={restaurant.id} restaurant={restaurant} index={i + 1} />
          ))}
        </div>
      </section>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RestaurantRow({
  restaurant,
  index,
}: {
  restaurant: Restaurant;
  index: number;
}) {
  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article
        className="pub-card"
        style={{
          background: "#2A1A60",
          borderRadius: 12,
          border: "1px solid #3D2E6E",
          marginBottom: 12,
          display: "grid",
          gridTemplateColumns: "48px 140px 1fr",
          gap: 0,
          overflow: "hidden",
          cursor: "pointer",
          alignItems: "stretch",
        }}
      >
        {/* Index number */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-roboto), sans-serif",
            fontSize: 18,
            fontWeight: 700,
            color: "#3D2E6E",
            background: "#1A1038",
            flexShrink: 0,
          }}
        >
          {index}
        </div>

        {/* Photo */}
        <div style={{ width: 140, flexShrink: 0, lineHeight: 0 }}>
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            width={140}
            height={100}
            style={{ objectFit: "cover", width: 140, height: "100%", minHeight: 100 }}
          />
        </div>

        {/* Info */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {restaurant.name}
          </h2>
          <p style={{ fontSize: 13, color: "#8b81a3", margin: 0 }}>
            {restaurant.neighborhood} · {restaurant.cuisine}
          </p>
          <TagCloud tags={restaurant.tags.slice(0, 3)} className="mt-1" />
        </div>
      </article>
    </Link>
  );
}

