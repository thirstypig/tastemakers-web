"use client";

import Link from "next/link";
import Image from "next/image";
import SignedOutPrompt from "@/features/profile/SignedOutPrompt";
import { useMe } from "@/features/profile/useMe";
import ListCard from "@/features/lists/ListCard";
import "@/features/profile/profile.css";

export default function BookmarksPage() {
  const me = useMe();

  if (me.status === "loading") {
    return (
      <div className="tm-results" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="tm-skel" style={{ height: 84, borderRadius: 8 }} />
        ))}
      </div>
    );
  }

  if (me.status === "anonymous") {
    return (
      <SignedOutPrompt
        title="Your bookmarks"
        body="Sign in to keep the places and lists you want to come back to."
      />
    );
  }

  if (me.status === "unsynced") {
    return (
      <div className="tm-card tm-empty">
        <h1 style={{ fontSize: 21, fontWeight: 800 }}>Account not linked yet</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 400 }}>
          This login isn't linked to a Tastemakers account yet, so there are no
          bookmarks to show.
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

  const { restaurants, lists } = me.data.bookmarks;
  const empty = restaurants.length === 0 && lists.length === 0;

  if (empty) {
    return (
      <div className="tm-card tm-empty">
        <h1 style={{ fontSize: 21, fontWeight: 800 }}>Nothing saved yet</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 380 }}>
          Tap the heart on a restaurant or a list and it will show up here.
        </p>
        <Link href="/restaurants" className="tm-btn tm-btn-primary" style={{ textDecoration: "none" }}>
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {restaurants.length > 0 ? (
        <section className="tm-section">
          <span className="tm-section-label">SAVED PLACES</span>
          <div className="tm-results">
            {restaurants.map((r) => (
              <Link key={r.id} href={`/restaurants/${r.slug}`} className="tm-result" style={{ textDecoration: "none" }}>
                <span className="tm-result-photo">
                  <Image src={r.imageUrl} alt="" fill sizes="150px" style={{ objectFit: "cover" }} />
                </span>
                <span className="tm-result-body">
                  <span className="tm-result-head">
                    <span style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                      <span className="tm-result-name">{r.name}</span>
                      <span className="tm-result-addr">{r.address}</span>
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {lists.length > 0 ? (
        <section className="tm-section">
          <span className="tm-section-label">SAVED LISTS</span>
          <div className="tm-listgrid">
            {lists.map((l) => (
              <ListCard
                key={l.id}
                href={`/lists/${l.slug}`}
                title={l.title}
                meta={l.meta}
                imageUrl={l.thumbnailUrl}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
