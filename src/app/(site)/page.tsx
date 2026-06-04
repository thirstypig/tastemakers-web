import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tastemakers — Restaurant lists by people with actual taste",
  description:
    "Tastemakers are curators who publish lists of their favorite restaurants. No algorithms. No ads.",
  alternates: { canonical: "https://app.tastemakersapp.com/" },
};

export default function HomePage() {
  return (
    <section
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: "120px 24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          marginBottom: 24,
        }}
      >
        Restaurant lists by people with actual taste
      </h1>
      <p
        style={{
          fontSize: "clamp(17px, 2.2vw, 21px)",
          color: "#B7ADCF",
          lineHeight: 1.6,
          maxWidth: 600,
          margin: "0 auto 40px",
        }}
      >
        Tastemakers are curators who publish lists of their favorite
        restaurants. No algorithms. No ads.
      </p>
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/explore"
          style={{
            background: "#DB1657",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            padding: "14px 28px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Explore Lists
        </Link>
        <Link
          href="/signup"
          style={{
            background: "transparent",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            padding: "14px 28px",
            borderRadius: 8,
            border: "1px solid #3D2E6E",
            textDecoration: "none",
          }}
        >
          Create Account
        </Link>
      </div>
    </section>
  );
}
