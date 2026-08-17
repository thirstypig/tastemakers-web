import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getList, listLists } from "@/features/lists/api";
import { isCanonicalSlug, parseIdFromSlug } from "@/lib/slug";
import ResultCard from "@/features/restaurants/ResultCard";
import { AdUnit } from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import "@/features/lists/lists.css";

const SITE_URL = "https://app.tastemakersapp.com";

export async function generateStaticParams() {
  const lists = await listLists();
  return lists.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = parseIdFromSlug(slug);
  const list = id ? await getList(id) : null;
  if (!list) return { title: "Not Found" };

  const description = `${list.restaurantCount} places${
    list.curatorName ? ` picked by ${list.curatorName}` : ""
  }.`;

  return {
    title: `${list.title} — Tastemakers`,
    description,
    openGraph: {
      title: list.title,
      description,
      url: `${SITE_URL}/lists/${list.slug}`,
      type: "article",
      images: [{ url: list.coverImageUrl, width: 800, height: 600, alt: list.title }],
    },
    alternates: { canonical: `${SITE_URL}/lists/${list.slug}` },
  };
}

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = parseIdFromSlug(slug);
  if (!id) notFound();

  const list = await getList(id);
  if (!list) notFound();

  if (!isCanonicalSlug(slug, list.title, list.id)) {
    permanentRedirect(`/lists/${list.slug}`);
  }

  const meta = `${list.restaurantCount} ${list.restaurantCount === 1 ? "place" : "places"}${
    list.curatorName ? ` · ${list.curatorName}` : ""
  }`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Desktop: photo header with a purple scrim. Mobile: stacked text. */}
      <div className="tm-listhero">
        <Image src={list.coverImageUrl} alt="" fill sizes="960px" style={{ objectFit: "cover" }} />
        <div className="tm-listhero-scrim" />
        <div className="tm-listhero-body">
          <h1 className="tm-listhero-title">{list.title}</h1>
          <p className="tm-listhero-meta">{meta}</p>
        </div>
      </div>

      <header className="tm-listhead">
        <Link href="/lists" className="tm-listhead-back">
          ‹ <span>All lists</span>
        </Link>
        <h1 className="tm-listhead-title">{list.title}</h1>
        <p className="tm-listhead-meta">{meta}</p>
      </header>

      {list.restaurants.length > 0 ? (
        <div className="tm-results">
          {list.restaurants.map((r) => (
            <ResultCard key={r.id} restaurant={r} />
          ))}
        </div>
      ) : (
        <div className="tm-card tm-empty">
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>This list is empty</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
            Nothing has been added to it yet.
          </p>
        </div>
      )}

      <AdUnit slot={AD_SLOTS.detailFooter} />
    </div>
  );
}
