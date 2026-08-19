import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listTastemakers } from "@/lib/api/index";
import type { Tastemaker } from "@/lib/api/types";
import ListCard from "@/features/lists/ListCard";
import { AdUnit } from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import { levelLabel } from "@/lib/api/shared";
import { canonical } from "@/lib/site";
import "@/features/tastemakers/tastemakers.css";

/**
 * Regenerate at most once a minute rather than querying Supabase per request.
 * Read-only catalogue view over data that changes rarely (TODO-094).
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tastemakers — Tastemakers",
  description:
    "Meet the curators behind every list. People who eat seriously and share what they find.",
  alternates: { canonical: canonical("/tastemakers") },
};

export default async function TastemakersPage() {
  const tastemakers = await listTastemakers();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Tastemakers</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
          The people whose lists you can follow.
        </p>
      </header>

      {tastemakers.length === 0 ? (
        <p className="tm-empty">No tastemakers yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tastemakers.map((t) => (
            <TastemakerRow key={t.id} tastemaker={t} />
          ))}
        </div>
      )}

      <AdUnit slot={AD_SLOTS.restaurantsFeed} minHeight={120} />
    </div>
  );
}

function TastemakerRow({ tastemaker: t }: { tastemaker: Tastemaker }) {
  return (
    <article className="tm-maker">
      <div className="tm-maker-head">
        <div className="tm-maker-avatar">
          <Image src={t.avatarUrl} alt="" width={56} height={56} />
        </div>

        <div className="tm-maker-body">
          <div className="tm-maker-nameline">
            <Link href={`/tastemakers/${t.slug}`} className="tm-maker-name">
              {t.name}
            </Link>
            <span className="tm-maker-level">{levelLabel(t.level)}</span>
          </div>

          {t.username && <p className="tm-maker-handle">@{t.username}</p>}
          {t.bio && <p className="tm-maker-bio">{t.bio}</p>}

          <div className="tm-maker-stats">
            {/*
              `followerCount` carries the TAG count, not followers — the field is
              misnamed upstream in lib/api. Labelled by what it holds rather than
              what it is called, because the label is what a reader believes.
            */}
            <span className="tm-maker-stat">
              <b>{t.listCount}</b> {t.listCount === 1 ? "list" : "lists"}
            </span>
            <span className="tm-maker-stat">
              <b>{t.followerCount}</b> {t.followerCount === 1 ? "tag" : "tags"}
            </span>
            <Link href={`/tastemakers/${t.slug}`} className="tm-maker-view">
              View profile
            </Link>
          </div>
        </div>
      </div>

      {t.lists.length > 0 && (
        <div className="tm-maker-lists">
          <p className="tm-maker-listlabel">Lists</p>
          <div className="tm-listgrid">
            {t.lists.map((list) => (
              <ListCard
                key={list.id}
                href={`/lists/${list.slug}`}
                title={list.title}
                meta={`by ${t.name}`}
                imageUrl={list.coverImageUrl}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
