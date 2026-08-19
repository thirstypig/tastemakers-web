/**
 * Suspense fallback for the Supabase-backed listing routes.
 *
 * Shared rather than copied per route: the three listing pages have the same
 * card-grid shape, and three near-identical skeletons would drift.
 *
 * `role="status"` + `aria-busy` are the load-bearing part. Without them a
 * screen-reader user gets no announcement at all during the fetch — the visual
 * placeholder is meaningless to them.
 */
export default function ListingSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-label={label}
      style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 24px" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              background: "#2A1A60",
              border: "1px solid #3D2E6E",
              borderRadius: 16,
              height: 160,
              opacity: 0.55,
            }}
          />
        ))}
      </div>
    </section>
  );
}
