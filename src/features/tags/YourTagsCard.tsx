"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import TagChip from "./TagChip";
import TagEditor, { type EditorTag } from "./TagEditor";

/**
 * The "Your tags" card on a restaurant page.
 *
 * Gating rule: content is never blurred or truncated — the tag cloud above
 * stays fully visible to anonymous visitors. Only the *action* is gated, so
 * this card is the one thing that changes when signed out.
 *
 * It resolves auth on the client so the page itself can stay statically
 * generated and indexable.
 */
export default function YourTagsCard({
  restaurantId,
  restaurantTags,
  myTags = [],
}: {
  restaurantId: string;
  restaurantTags: EditorTag[];
  myTags?: string[];
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);

  // Reserve the card's height while auth resolves so the layout doesn't jump.
  if (loading) {
    return (
      <div className="tm-card tm-yourtags" aria-busy="true">
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Your tags</h2>
        <div style={{ height: 48 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="tm-card tm-yourtags">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Your tags</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--tm-muted)" }}>
            Sign in to tag this place, heart photos, and bookmark it.
          </p>
        </div>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="tm-btn tm-btn-primary tm-yourtags-cta"
        >
          Sign in to tag
        </Link>
      </div>
    );
  }

  // The editor expands in place — same page, no separate route.
  if (editing) {
    return (
      <TagEditor
        restaurantId={restaurantId}
        restaurantTags={restaurantTags}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="tm-card tm-yourtags">
      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Your tags</h2>
        {myTags.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {myTags.map((t) => (
              <TagChip key={t} label={t} variant="mine" />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--tm-muted)" }}>
            No tags yet — be the first to tag this place.
          </p>
        )}
      </div>
      <button
        type="button"
        className="tm-btn tm-btn-primary tm-yourtags-cta"
        onClick={() => setEditing(true)}
      >
        Add your tags
      </button>
    </div>
  );
}
