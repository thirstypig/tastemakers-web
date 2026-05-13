"use client";

import Link from "next/link";
import { usePublicAuth } from "@/hooks/usePublicAuth";

export function NavAuth() {
  const { user, loading, signOut } = usePublicAuth();

  if (loading) {
    // Render a fixed-width placeholder to avoid layout shift
    return <div style={{ width: 80 }} />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "8px 18px",
          borderRadius: 6,
          background: "#DB1657",
          color: "#fff",
          fontWeight: 600,
          fontSize: 14,
          textDecoration: "none",
          letterSpacing: "0.02em",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#b8134a";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#DB1657";
        }}
      >
        Sign In
      </Link>
    );
  }

  const displayName =
    user.user_metadata?.first_name ??
    user.user_metadata?.given_name ??
    user.email?.split("@")[0] ??
    "U";

  const initial = displayName[0].toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        title={user.email}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#DB1657",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
      <button
        onClick={signOut}
        style={{
          background: "transparent",
          border: "1px solid #3D2E6E",
          borderRadius: 6,
          color: "#B7ADCF",
          fontSize: 13,
          fontWeight: 500,
          padding: "6px 12px",
          cursor: "pointer",
          transition: "border-color 0.15s ease, color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.borderColor = "#DB1657";
          btn.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.borderColor = "#3D2E6E";
          btn.style.color = "#B7ADCF";
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
