import type { Metadata } from "next";
import Link from "next/link";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Explore — Tastemakers",
  description:
    "Browse curated lists, restaurants, and the tastemakers behind them.",
  alternates: { canonical: canonical("/explore") },
};

const DESTINATIONS = [
  { href: "/lists", title: "Lists", blurb: "Curated restaurant lists, each a point of view." },
  { href: "/restaurants", title: "Restaurants", blurb: "Every place, tagged by people who eat seriously." },
  { href: "/tastemakers", title: "Tastemakers", blurb: "The curators whose taste you can trust." },
];

export default function ExplorePage() {
  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 24px" }}>
      <h1
        style={{
          fontSize: "clamp(32px, 5vw, 52px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Explore
      </h1>
      <p style={{ color: "#B7ADCF", fontSize: 18, textAlign: "center", marginBottom: 48 }}>
        Start anywhere.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {DESTINATIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="pub-card"
            style={{
              display: "block",
              background: "#2A1A60",
              border: "1px solid #3D2E6E",
              borderRadius: 16,
              padding: "28px 24px",
              textDecoration: "none",
            }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              {d.title}
            </h2>
            <p style={{ fontSize: 14, color: "#8b81a3", lineHeight: 1.6, margin: 0 }}>
              {d.blurb}
            </p>
            <span
              style={{
                display: "inline-block",
                marginTop: 16,
                color: "#DB1657",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Browse {d.title} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
