"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

// Gating-pattern template for future auth-required features. Unauthenticated
// users are NOT redirected — they see an inline prompt and stay on the page.
export default function ReviewPage() {
  const { user, loading } = useAuth();

  return (
    <section
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "96px 24px",
        textAlign: "center",
      }}
    >
      {loading ? (
        <p style={{ color: "#8b81a3" }}>Loading…</p>
      ) : user ? (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            Write a review
          </h1>
          <p style={{ color: "#B7ADCF", fontSize: 16 }}>
            Review form coming soon.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
            You need an account to write a review
          </h1>
          <p style={{ color: "#B7ADCF", fontSize: 16, marginBottom: 32 }}>
            Sign in or create a free account to share your take.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/login?next=/review"
              style={{
                background: "#3D2E6E",
                border: "1px solid #594094",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Log In
            </Link>
            <Link
              href="/signup"
              style={{
                background: "#DB1657",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                padding: "12px 24px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Sign Up
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
