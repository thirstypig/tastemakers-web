"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Root error boundary.
 *
 * Next.js requires this to be a client component, and hands it the error plus a
 * `reset` that re-renders the failed segment. Retrying matters here because the
 * common failure on this site is a transient Supabase read, not a broken page —
 * a reload usually is the fix.
 *
 * The visitor is deliberately not shown `error.message`. Server errors reach
 * this component with database hosts, ports and driver text in them, and this
 * page renders on public, indexed routes.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled render error:", error);
  }, [error]);

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
        That didn&apos;t load
      </h1>
      <p style={{ color: "#B7ADCF", fontSize: 18, lineHeight: 1.6, marginBottom: 32 }}>
        Something broke on our side. Trying again often works — this is usually a
        hiccup rather than a missing page.
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#DB1657",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/explore"
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
          Back to Explore
        </Link>
      </div>

      {error.digest ? (
        <p style={{ color: "#8b81a3", fontSize: 13, marginTop: 32 }}>
          Reference: {error.digest}
        </p>
      ) : null}
    </section>
  );
}
