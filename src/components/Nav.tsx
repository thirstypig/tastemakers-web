"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

// Auth-aware top nav for the marketing/app-shell routes (/, /explore, /review).
// The (public) browse pages keep their own header.
export function Nav() {
  const { user, loading, signOut } = useAuth();

  const displayName =
    (user?.user_metadata?.username as string | undefined) ||
    (user?.user_metadata?.first_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Account";

  return (
    <header
      style={{
        background: "#2A1A60",
        borderBottom: "1px solid #3D2E6E",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.02em",
            textDecoration: "none",
          }}
        >
          TASTEMAKERS
        </Link>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link href="/explore" className="pub-nav-link">
            Explore
          </Link>

          {loading ? null : user ? (
            <>
              <span style={{ color: "#B7ADCF", fontSize: 14 }}>
                {displayName}
              </span>
              <button
                type="button"
                onClick={signOut}
                style={{
                  background: "none",
                  border: "1px solid #3D2E6E",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 14,
                  padding: "7px 14px",
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="pub-nav-link">
                Log in
              </Link>
              <Link
                href="/signup"
                style={{
                  background: "#DB1657",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "8px 16px",
                  textDecoration: "none",
                }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
