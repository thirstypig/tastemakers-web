"use client";

import TagChip from "@/features/tags/TagChip";
import SignedOutPrompt from "@/features/profile/SignedOutPrompt";
import { useMe } from "@/features/profile/useMe";
import "@/features/profile/profile.css";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProfilePage() {
  const me = useMe();

  if (me.status === "loading") {
    return (
      <div className="tm-card tm-profile-head" aria-busy="true">
        <span className="tm-skel" style={{ width: 64, height: 64, borderRadius: "50%" }} />
        <span className="tm-skel" style={{ width: 180, height: 22 }} />
      </div>
    );
  }

  // Middleware normally redirects anonymous visitors away from /profile before
  // this renders. It is still reachable when the gate is skipped — middleware
  // bails out entirely if SUPABASE_URL/ANON_KEY are unset — so this is the
  // fallback for that path, not dead code. /bookmarks is not in the middleware
  // matcher at all and always lands here.
  if (me.status === "anonymous") {
    return (
      <SignedOutPrompt
        title="Your profile"
        body="Sign in to see the tags you've added, the places you've been, and the badges you're working toward."
      />
    );
  }

  if (me.status === "unsynced") {
    return (
      <div className="tm-card tm-empty">
        <h1 style={{ fontSize: 21, fontWeight: 800 }}>Account not linked yet</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 400 }}>
          You're signed in, but this login isn't linked to a Tastemakers account
          yet, so there are no tags to show.
        </p>
      </div>
    );
  }

  if (me.status === "error") {
    return (
      <div className="tm-card tm-empty">
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>{me.message}</p>
      </div>
    );
  }

  const { name, stats, recentTags, badges } = me.data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="tm-card tm-profile-head">
        <span className="tm-profile-avatar" aria-hidden="true">
          {initials(name)}
        </span>
        <div>
          <h1 className="tm-profile-name">{name}</h1>
          <p className="tm-profile-stats">
            {stats.tags} {stats.tags === 1 ? "tag" : "tags"} · {stats.places}{" "}
            {stats.places === 1 ? "place" : "places"} · {stats.badges}{" "}
            {stats.badges === 1 ? "badge" : "badges"}
          </p>
        </div>
      </div>

      <section className="tm-section">
        <span className="tm-section-label">BADGES</span>
        {badges.length > 0 ? (
          <div className="tm-badges">
            {badges.map((b) => (
              <div key={b.id} className="tm-badge" data-state="locked">
                <span className="tm-badge-dot" aria-hidden="true" />
                <span className="tm-badge-name">{b.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="tm-card" style={{ padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--tm-muted)" }}>
              No badges are defined yet. Badges are awarded per cuisine, and the
              cuisine categories haven't been set up on this account.
            </p>
          </div>
        )}
      </section>

      <section className="tm-section">
        <span className="tm-section-label">YOUR RECENT TAGS</span>
        {recentTags.length > 0 ? (
          <div className="tm-card" style={{ padding: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {recentTags.map((t) => (
              <TagChip key={t.id} label={t.name} variant="mine" />
            ))}
          </div>
        ) : (
          <div className="tm-card" style={{ padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
              You haven't tagged anywhere yet. Find a place and tell people what
              mattered.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
