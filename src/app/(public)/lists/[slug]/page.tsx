import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { getList, listLists, listTastemakers } from "@/lib/api/index";
import type { CuratedList, Restaurant, Tag, Tastemaker } from "@/lib/api/types";

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

function buildItemListSchema(list: CuratedList, curator: Tastemaker | null): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.title,
    description: list.description,
    url: `${SITE_URL}/lists/${list.slug}`,
    numberOfItems: list.restaurantCount,
    author: curator
      ? {
          "@type": "Person",
          name: curator.name,
          url: `${SITE_URL}/tastemakers/${curator.slug}`,
        }
      : undefined,
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

// ── Tag colors ─────────────────────────────────────────────────────────────────

const TAG_BG: Record<number, string>   = { 1: "#3D296E", 2: "#594094", 3: "#876DC4", 4: "#9B82D4", 5: "#EFE8FE" };
const TAG_TEXT: Record<number, string> = { 1: "#B7ADCF", 2: "#EFE8FE", 3: "#fff",    4: "#fff",    5: "#2A1A60" };

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [list, tastemakers] = await Promise.all([getList(slug), listTastemakers()]);
  if (!list) notFound();

  const curator = tastemakers.find((t) =>
    t.lists.some((l) => l.slug === list.slug)
  ) ?? null;

  const schema = buildItemListSchema(list, curator);

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
            <Link
              href="/tastemakers"
              style={{ color: "#8b81a3", fontSize: 13, textDecoration: "none" }}
            >
              Tastemakers
            </Link>
            {curator && (
              <>
                <span style={{ color: "#3D2E6E", margin: "0 6px" }}>›</span>
                <Link
                  href={`/tastemakers/${curator.slug}`}
                  style={{ color: "#8b81a3", fontSize: 13, textDecoration: "none" }}
                >
                  {curator.name}
                </Link>
              </>
            )}
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

            {curator && (
              <Link
                href={`/tastemakers/${curator.slug}`}
                style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
              >
                <Image
                  src={curator.avatarUrl}
                  alt={curator.name}
                  width={28}
                  height={28}
                  style={{ borderRadius: "50%", border: "1.5px solid #DB1657", objectFit: "cover" }}
                />
                <span style={{ color: "#B7ADCF", fontSize: 14 }}>
                  by <strong style={{ color: "#fff" }}>{curator.name}</strong>
                </span>
              </Link>
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
          {restaurant.tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {restaurant.tags.slice(0, 3).map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
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
  );
}
