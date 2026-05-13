import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { getTastemaker, listTastemakers } from "@/lib/api/index";
import type { Tastemaker, CuratedList, Tag } from "@/lib/api/types";

const SITE_URL = "https://app.tastemakersapp.com";

// ── Static params (pre-rendered at build) ─────────────────────────────────────

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

  const url = `${SITE_URL}/tastemakers/${t.slug}`;

  return {
    title: `${t.name} — Tastemakers`,
    description: t.bio,
    openGraph: {
      title: t.name,
      description: t.bio,
      url,
      type: "profile",
      images: [{ url: t.avatarUrl, width: 400, height: 400, alt: t.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t.name} on Tastemakers`,
      description: t.bio,
      images: [t.avatarUrl],
    },
    alternates: { canonical: url },
  };
}

// ── JSON-LD ────────────────────────────────────────────────────────────────────

function buildPersonSchema(t: Tastemaker): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.name,
    description: t.bio,
    image: t.avatarUrl,
    url: `${SITE_URL}/tastemakers/${t.slug}`,
    identifier: t.username,
    knowsAbout: ["Restaurants", "Food", "Dining", ...t.tags.map((tag) => tag.name)],
    hasCreativeWork: t.lists.map((list) => ({
      "@type": "ItemList",
      name: list.title,
      description: list.description,
      url: `${SITE_URL}/lists/${list.slug}`,
      numberOfItems: list.restaurantCount,
    })),
  };
  // Unicode-escape HTML special chars so the JSON string is safe inside a script tag
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

// ── Level + tag colors — ported from iOS palette ───────────────────────────────

const LEVEL_META: Record<
  number,
  { bg: string; text: string; border: string; label: string }
> = {
  1: { bg: "#3D296E", text: "#B7ADCF", border: "#594094", label: "Newcomer" },
  2: { bg: "#594094", text: "#EFE8FE", border: "#876DC4", label: "Rising" },
  3: { bg: "#876DC4", text: "#fff",    border: "#9B82D4", label: "Established" },
  4: { bg: "#DB1657", text: "#fff",    border: "#B8124A", label: "Influencer" },
  5: { bg: "#EFE8FE", text: "#2A1A60", border: "#B7ADCF", label: "Legend" },
};

const TAG_BG: Record<number, string>   = { 1: "#3D296E", 2: "#594094", 3: "#876DC4", 4: "#9B82D4", 5: "#EFE8FE" };
const TAG_TEXT: Record<number, string> = { 1: "#B7ADCF", 2: "#EFE8FE", 3: "#fff",    4: "#fff",    5: "#2A1A60" };

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TastemakerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tastemaker = await getTastemaker(slug);
  if (!tastemaker) notFound();

  const level = LEVEL_META[tastemaker.level] ?? LEVEL_META[1];
  const schema = buildPersonSchema(tastemaker);

  return (
    <>
      {/* JSON-LD structured data — server-serialized typed data, unicode-escaped */}
      <Script id="person-schema" type="application/ld+json" strategy="beforeInteractive">
        {schema}
      </Script>

      {/* Profile Hero */}
      <section
        style={{
          background: "linear-gradient(180deg, #3D296E 0%, #2A1A60 40%, #1A1038 100%)",
          padding: "64px 24px 72px",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 20,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "3px solid #DB1657",
              overflow: "hidden",
              boxShadow: "0 0 0 6px rgba(219,22,87,0.15)",
            }}
          >
            <Image
              src={tastemaker.avatarUrl}
              alt={tastemaker.name}
              width={120}
              height={120}
              priority
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>

          {/* Name — single H1 per page for SEO */}
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            {tastemaker.name}
          </h1>

          {/* Username + location */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#8b81a3", fontSize: 14 }}>
              @{tastemaker.username}
            </span>
            <span style={{ color: "#3D2E6E" }}>·</span>
            <span style={{ color: "#8b81a3", fontSize: 14 }}>
              {tastemaker.location}
            </span>
          </div>

          {/* Bio */}
          <p
            style={{
              fontSize: 18,
              color: "#B7ADCF",
              lineHeight: 1.7,
              maxWidth: 560,
              margin: 0,
            }}
          >
            {tastemaker.bio}
          </p>

          {/* Stats + level badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <span
              style={{
                background: level.bg,
                color: level.text,
                border: `1px solid ${level.border}`,
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: 20,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Level {tastemaker.level} · {level.label}
            </span>
            <StatBadge value={tastemaker.listCount} label="lists" />
            <StatBadge value={tastemaker.followerCount.toLocaleString()} label="followers" />
          </div>

          {/* Known-for tags */}
          {tastemaker.tags.length > 0 && (
            <div
              style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}
            >
              {tastemaker.tags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Curated Lists */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        <h2
          style={{
            fontSize: "clamp(22px, 3vw, 32px)",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.02em",
            marginBottom: 32,
          }}
        >
          Lists by {tastemaker.name.split(" ")[0]}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {tastemaker.lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      </section>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBadge({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", display: "block" }}>
        {value}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "#8b81a3",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function TagChip({ tag }: { tag: Tag }) {
  return (
    <span
      style={{
        background: TAG_BG[tag.level] ?? "#3D296E",
        color: TAG_TEXT[tag.level] ?? "#B7ADCF",
        fontSize: 12,
        fontWeight: 500,
        padding: "4px 12px",
        borderRadius: 4,
      }}
    >
      {tag.name}
    </span>
  );
}

function ListCard({ list }: { list: CuratedList }) {
  return (
    <Link href={`/lists/${list.slug}`} style={{ textDecoration: "none", display: "block" }}>
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
        {/* Cover image */}
        <div style={{ position: "relative", height: 180 }}>
          <Image
            src={list.coverImageUrl}
            alt={list.title}
            fill
            sizes="(max-width: 1100px) 50vw, 350px"
            style={{ objectFit: "cover" }}
          />
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(219,22,87,0.9)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 20,
            }}
          >
            {list.restaurantCount} spots
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px" }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 8px",
              letterSpacing: "-0.01em",
            }}
          >
            {list.title}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "#8b81a3",
              lineHeight: 1.5,
              margin: "0 0 16px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {list.description}
          </p>
          <span
            style={{
              color: "#DB1657",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            View list →
          </span>
        </div>
      </article>
    </Link>
  );
}
