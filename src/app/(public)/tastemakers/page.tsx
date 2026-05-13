import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listTastemakers } from "@/lib/api/index";
import type { Tastemaker } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Tastemakers — Trusted Restaurant Curators",
  description:
    "Discover restaurants through people whose taste you trust. Browse curated lists from New York's best food tastemakers.",
  openGraph: {
    title: "Tastemakers — Trusted Restaurant Curators",
    description:
      "Browse curated lists from New York's best food tastemakers.",
    type: "website",
  },
  alternates: {
    canonical: "https://app.tastemakersapp.com/tastemakers",
  },
};

const LEVEL_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "#3D296E", text: "#B7ADCF", label: "Newcomer" },
  2: { bg: "#594094", text: "#EFE8FE", label: "Rising" },
  3: { bg: "#876DC4", text: "#fff", label: "Established" },
  4: { bg: "#DB1657", text: "#fff", label: "Influencer" },
  5: { bg: "#EFE8FE", text: "#2A1A60", label: "Legend" },
};

export default async function TastemakersPage() {
  const tastemakers = await listTastemakers();

  return (
    <>
      {/* Page header */}
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
          The Tastemakers
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#B7ADCF",
            maxWidth: 480,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          People who eat for a living — or might as well. Their lists are the
          ones worth following.
        </p>
      </section>

      {/* Tastemaker grid */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {tastemakers.map((t) => (
            <TastemakerCard key={t.id} tastemaker={t} />
          ))}
        </div>
      </section>
    </>
  );
}

function TastemakerCard({ tastemaker: t }: { tastemaker: Tastemaker }) {
  const level = LEVEL_COLORS[t.level] ?? LEVEL_COLORS[1];
  return (
    <Link
      href={`/tastemakers/${t.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <article
        className="pub-card"
        style={{
          background: "#2A1A60",
          borderRadius: 16,
          border: "1px solid #3D2E6E",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              border: "2px solid #DB1657",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <Image
              src={t.avatarUrl}
              alt={t.name}
              width={64}
              height={64}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>
              {t.name}
            </h2>
            <p style={{ fontSize: 13, color: "#8b81a3", margin: "2px 0 0" }}>
              {t.location}
            </p>
          </div>
        </div>

        <p
          style={{
            fontSize: 14,
            color: "#B7ADCF",
            lineHeight: 1.6,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {t.bio}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              background: level.bg,
              color: level.text,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            L{t.level} · {level.label}
          </span>
          <span style={{ color: "#8b81a3", fontSize: 13 }}>
            {t.listCount} {t.listCount === 1 ? "list" : "lists"}
          </span>
          <span style={{ color: "#8b81a3", fontSize: 13 }}>
            {t.followerCount.toLocaleString()} followers
          </span>
        </div>
      </article>
    </Link>
  );
}
