import Link from "next/link";

/**
 * Root 404.
 *
 * This is a search-traffic page, not an edge case: restaurant and list slugs are
 * derived from names, so a renamed or removed record leaves indexed URLs that
 * resolve here. Anyone landing on it arrived intending to look at a restaurant,
 * so the job is to route them onward rather than apologise.
 */
export default function NotFound() {
  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
      <h1
        style={{
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          marginBottom: 12,
        }}
      >
        Not here
      </h1>
      <p style={{ color: "#B7ADCF", fontSize: 18, lineHeight: 1.6, marginBottom: 32 }}>
        This page has moved or never existed. The restaurant you were after may
        have been renamed.
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/explore"
          style={{
            background: "#DB1657",
            color: "#fff",
            borderRadius: 12,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Explore
        </Link>
        <Link
          href="/restaurants"
          style={{
            background: "#2A1A60",
            border: "1px solid #3D2E6E",
            borderRadius: 12,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Browse restaurants
        </Link>
      </div>
    </section>
  );
}
