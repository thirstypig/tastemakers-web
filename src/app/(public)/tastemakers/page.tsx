import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listTastemakers } from "@/lib/api/index";
import type { Tastemaker, CuratedList } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Tastemakers — Tastemakers",
  description:
    "Meet the curators behind every list. People who eat seriously and share what they find.",
  alternates: { canonical: "https://app.tastemakersapp.com/tastemakers" },
};

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

export default async function TastemakersPage() {
  const tastemakers = await listTastemakers();

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
          Tastemakers
        </h1>
        <p style={{ fontSize: 18, color: "#B7ADCF", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Discover restaurants through people whose taste you trust.
        </p>
      </section>

      <section style={{ maxWidth: 860, margin: "0 auto", padding: "64px 24px 80px" }}>
        {tastemakers.length === 0 ? (
          <p style={{ color: "#8b81a3", textAlign: "center", fontSize: 16 }}>
            No tastemakers yet — check back soon.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {tastemakers.map((t) => (
              <TastemakerCard key={t.id} tastemaker={t} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function TastemakerCard({ tastemaker: t }: { tastemaker: Tastemaker }) {
  return (
    <article
      className="pub-card"
      style={{
        background: "#2A1A60",
        borderRadius: 16,
        border: "1px solid #3D2E6E",
        overflow: "hidden",
      }}
    >
      {/* Header: avatar + info */}
      <div style={{ padding: "24px 28px 20px", display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
            border: "2px solid #DB1657",
          }}
        >
          <Image
            src={t.avatarUrl}
            alt={t.name}
            width={72}
            height={72}
            style={{ objectFit: "cover", width: 72, height: 72 }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <Link href={`/tastemakers/${t.slug}`} style={{ textDecoration: "none" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{t.name}</h2>
            </Link>
            <span
              style={{
                background: LEVEL_COLOR[t.level] ?? "#594094",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: 20,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {LEVEL_LABEL[t.level] ?? "Curator"}
            </span>
          </div>

          {t.username && (
            <p style={{ fontSize: 13, color: "#8b81a3", margin: "0 0 8px" }}>@{t.username}</p>
          )}

          {t.bio && (
            <p
              style={{
                fontSize: 14,
                color: "#B7ADCF",
                lineHeight: 1.55,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {t.bio}
            </p>
          )}

          <div style={{ display: "flex", gap: 20, marginTop: 12, alignItems: "center" }}>
            <Stat label="Lists" value={t.listCount} />
            <Stat label="Tags" value={t.followerCount} />
            <Link
              href={`/tastemakers/${t.slug}`}
              style={{ marginLeft: "auto", fontSize: 13, color: "#DB1657", textDecoration: "none", fontWeight: 600 }}
            >
              View profile →
            </Link>
          </div>
        </div>
      </div>

      {/* Lists preview */}
      {t.lists.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #3D2E6E",
            padding: "16px 28px 20px",
          }}
        >
          <p style={{ fontSize: 12, color: "#8b81a3", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Lists
          </p>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {t.lists.map((list) => (
              <MiniListCard key={list.id} list={list} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{value}</span>
      <span style={{ fontSize: 12, color: "#8b81a3", marginLeft: 4 }}>{label}</span>
    </div>
  );
}

function MiniListCard({ list }: { list: CuratedList }) {
  return (
    <Link href={`/lists/${list.slug}`} style={{ textDecoration: "none", flexShrink: 0 }}>
      <div
        className="pub-card"
        style={{
          width: 160,
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid #3D2E6E",
        }}
      >
        <div style={{ position: "relative", height: 90 }}>
          <Image
            src={list.coverImageUrl}
            alt={list.title}
            fill
            sizes="160px"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div style={{ padding: "8px 10px 10px", background: "#1A1038" }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.4,
            }}
          >
            {list.title}
          </p>
        </div>
      </div>
    </Link>
  );
}
