import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTastemaker, listTastemakers } from "@/lib/api/index";
import type { CuratedList } from "@/lib/api/types";
import TagCloud from "@/components/tags/TagCloud";

const SITE_URL = "https://app.tastemakersapp.com";

const LEVEL_LABEL: Record<number, string> = {
  1: "Explorer",
  2: "Curator",
  3: "Connoisseur",
  4: "Maven",
  5: "Legend",
};

const LEVEL_COLOR: Record<number, string> = {
  1: "#3D296E",
  2: "#594094",
  3: "#876DC4",
  4: "#DB1657",
  5: "#DB1657",
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

  const url = `${SITE_URL}/tastemakers/${t.slug}`;
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

  const levelColor = LEVEL_COLOR[tastemaker.level] ?? "#594094";
  const levelLabel = LEVEL_LABEL[tastemaker.level] ?? "Curator";

  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(180deg, #3D296E 0%, #1A1038 100%)",
          padding: "56px 24px 48px",
        }}
      >
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/tastemakers"
            style={{ color: "#8b81a3", fontSize: 13, textDecoration: "none", display: "inline-block", marginBottom: 28 }}
          >
            ← Tastemakers
          </Link>

          {/* Avatar + identity */}
          <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                border: "3px solid #DB1657",
              }}
            >
              <Image
                src={tastemaker.avatarUrl}
                alt={tastemaker.name}
                width={112}
                height={112}
                priority
                style={{ objectFit: "cover", width: 112, height: 112 }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                <h1
                  style={{
                    fontSize: "clamp(24px, 3vw, 36px)",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  {tastemaker.name}
                </h1>
                <span
                  style={{
                    background: levelColor,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 12px",
                    borderRadius: 20,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {levelLabel}
                </span>
              </div>

              {tastemaker.username && (
                <p style={{ fontSize: 14, color: "#8b81a3", margin: "0 0 12px" }}>
                  @{tastemaker.username}
                </p>
              )}

              {/* Stats */}
              <div style={{ display: "flex", gap: 28, marginBottom: tastemaker.bio ? 18 : 0 }}>
                <StatPill value={tastemaker.listCount} label="Lists" />
                <StatPill value={tastemaker.followerCount} label="Tag votes" />
              </div>

              {tastemaker.bio && (
                <p
                  style={{
                    fontSize: 15,
                    color: "#B7ADCF",
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: 520,
                  }}
                >
                  {tastemaker.bio}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          {tastemaker.tags.length > 0 && (
            <div style={{ marginTop: 28 }}>
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
              <TagCloud tags={tastemaker.tags} />
            </div>
          )}
        </div>
      </section>

      {/* Lists */}
      <section style={{ maxWidth: 740, margin: "0 auto", padding: "56px 24px 80px" }}>
        {tastemaker.lists.length === 0 ? (
          <p style={{ color: "#8b81a3", fontSize: 15 }}>No lists yet.</p>
        ) : (
          <>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.02em",
                marginBottom: 20,
              }}
            >
              Curated Lists
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {tastemaker.lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{value}</span>
      <span style={{ fontSize: 13, color: "#8b81a3", marginLeft: 5 }}>{label}</span>
    </div>
  );
}

function ListCard({ list }: { list: CuratedList }) {
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
            sizes="(max-width: 740px) 100vw, 350px"
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
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.35 }}>
            {list.title}
          </p>
          <p style={{ fontSize: 12, color: "#8b81a3", margin: 0 }}>
            {list.restaurantCount} {list.restaurantCount === 1 ? "spot" : "spots"}
          </p>
        </div>
      </article>
    </Link>
  );
}
