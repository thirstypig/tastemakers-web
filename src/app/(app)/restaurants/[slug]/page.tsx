import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Script from "next/script";
import { getRestaurantDetail, listRestaurants } from "@/features/restaurants/api";
import type { RestaurantDetail } from "@/lib/api/types";
import RestaurantDetailView from "@/features/restaurants/RestaurantDetailView";
import { isCanonicalSlug, parseIdFromSlug } from "@/lib/slug";
import { canonical } from "@/lib/site";

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
  const id = parseIdFromSlug(slug);
  const r = id ? await getRestaurantDetail(id) : null;
  if (!r) return { title: "Not Found" };

  const url = canonical(`/restaurants/${r.slug}`);
  const description = `${r.cuisine} in ${r.city}. See what people tagged at ${r.name}.`;

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

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function buildRestaurantSchema(r: RestaurantDetail): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: r.name,
    servesCuisine: r.cuisine,
    image: r.imageUrl,
    url: canonical(`/restaurants/${r.slug}`),
    address: {
      "@type": "PostalAddress",
      streetAddress: r.address,
      addressLocality: r.city,
    },
    ...(r.phone ? { telephone: r.phone } : {}),
    ...(r.website ? { sameAs: r.website } : {}),
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
  const id = parseIdFromSlug(slug);
  if (!id) notFound();

  const r = await getRestaurantDetail(id);
  if (!r) notFound();

  // Old numeric URLs and stale names still resolve, but 308 to the canonical
  // slug so search engines only ever index one URL per restaurant.
  if (!isCanonicalSlug(slug, r.name, r.id)) {
    permanentRedirect(`/restaurants/${r.slug}`);
  }

  return (
    <>
      <Script id="restaurant-schema" type="application/ld+json" strategy="beforeInteractive">
        {buildRestaurantSchema(r)}
      </Script>
      <RestaurantDetailView restaurant={r} />
    </>
  );
}
