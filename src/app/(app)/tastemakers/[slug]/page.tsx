import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTastemaker, listTastemakers } from "@/lib/api/index";
import TagCloud from "@/components/tags/TagCloud";
import ListCard from "@/features/lists/ListCard";
import { AdUnit } from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import { canonical } from "@/lib/site";
import "@/features/tastemakers/tastemakers.css";


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

const LEVEL_LABEL: Record<number, string> = {
  1: "Explorer",
  2: "Curator",
  3: "Connoisseur",
  4: "Maven",
  5: "Legend",
};

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const tastemakers = await listTastemakers();
  return tastemakers.map((t) => ({ slug: t.slug }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTastemaker(slug);
  if (!t) return { title: "Not Found" };

  const url = canonical(`/tastemakers/${t.slug}`);
  const description = t.bio || `${t.name} has curated ${t.listCount} restaurant lists on Tastemakers.`;

  return {
    title: `${t.name} — Tastemakers`,
    description,
    openGraph: {
      title: t.name,
      description,
      url,
      type: "profile",
      images: [{ url: t.avatarUrl, width: 400, height: 400, alt: t.name }],
    },
    twitter: {
      card: "summary",
      title: t.name,
      description,
      images: [t.avatarUrl],
    },
    alternates: { canonical: url },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TastemakerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tastemaker = await getTastemaker(slug);
  if (!tastemaker) notFound();

  const levelLabel = LEVEL_LABEL[tastemaker.level] ?? "Curator";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Link href="/tastemakers" className="tm-maker-view" style={{ marginLeft: 0 }}>
        &larr; Tastemakers
      </Link>

      <header className="tm-maker-head" style={{ padding: 0 }}>
        <div className="tm-maker-avatar" style={{ width: 88, height: 88 }}>
          <Image
            src={tastemaker.avatarUrl}
            alt=""
            width={88}
            height={88}
            priority
            style={{ width: 88, height: 88 }}
          />
        </div>

        <div className="tm-maker-body">
          <div className="tm-maker-nameline">
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>{tastemaker.name}</h1>
            <span className="tm-maker-level">{levelLabel}</span>
          </div>

          {tastemaker.username && <p className="tm-maker-handle">@{tastemaker.username}</p>}

          <div className="tm-maker-stats">
            <span className="tm-maker-stat">
              <b>{tastemaker.listCount}</b> {tastemaker.listCount === 1 ? "list" : "lists"}
            </span>
            {/* followerCount holds the TAG count — misnamed upstream in lib/api.
                Labelled by what it contains, because the label is what a reader
                believes. */}
            <span className="tm-maker-stat">
              <b>{tastemaker.followerCount}</b>{" "}
              {tastemaker.followerCount === 1 ? "tag" : "tags"}
            </span>
          </div>

          {tastemaker.bio && <p className="tm-maker-bio" style={{ WebkitLineClamp: "unset" }}>{tastemaker.bio}</p>}
        </div>
      </header>

      {tastemaker.tags.length > 0 && (
        <section>
          <p className="tm-maker-listlabel">Known for</p>
          <TagCloud tags={tastemaker.tags} />
        </section>
      )}

      <section>
        <p className="tm-maker-listlabel">Lists</p>
        {tastemaker.lists.length === 0 ? (
          <p className="tm-empty">No lists yet.</p>
        ) : (
          <div className="tm-listgrid">
            {tastemaker.lists.map((list) => (
              <ListCard
                key={list.id}
                href={`/lists/${list.slug}`}
                title={list.title}
                meta={`by ${tastemaker.name}`}
                imageUrl={list.coverImageUrl}
              />
            ))}
          </div>
        )}
      </section>

      <AdUnit slot={AD_SLOTS.detailFooter} />
    </div>
  );
}
