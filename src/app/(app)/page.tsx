import type { Metadata } from "next";
import Link from "next/link";
import { getHomeData } from "@/features/home/api";
import { DEFAULT_CITY } from "@/lib/api/cities";
import PitchBand from "@/features/home/PitchBand";
import ResultCard from "@/features/restaurants/ResultCard";
import ListCard from "@/features/lists/ListCard";
import EmailSignup from "@/features/email/EmailSignup";
import "@/features/home/home.css";
import { canonical } from "@/lib/site";


/**
 * Regenerate at most once a minute rather than querying Supabase per request.
 *
 * This is a read-only catalogue view over data that changes rarely — production
 * tagging is down 98.5% and the newest tag is from 2025 — so a 60s window is
 * invisible to a visitor and removes almost all of the database load behind the
 * SEO-indexed surface. Every public page previously had NO revalidate at all
 * (TODO-094).
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tastemakers — reviews in words, not stars",
  description:
    "Restaurant reviews as tags: loud room, worth the wait, cash only. Browse what people actually tagged.",
  alternates: { canonical: canonical("/") },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: requested } = await searchParams;
  const { city, lists, recentlyTagged } = await getHomeData(requested ?? DEFAULT_CITY);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Screen 5 only — removes itself once signed in (screen 6). */}
      <PitchBand />

      {lists.length > 0 ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="tm-sechead">
            <h2 className="tm-sectitle">Lists in {city}</h2>
            <Link href="/lists" className="tm-link" style={{ fontSize: 14 }}>
              See all
            </Link>
          </div>
          <div className="tm-listrail">
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

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="tm-sechead">
          <h2 className="tm-sectitle">Recently tagged</h2>
          <Link href="/restaurants" className="tm-link" style={{ fontSize: 14 }}>
            See all
          </Link>
        </div>

        {recentlyTagged.length > 0 ? (
          <div className="tm-results">
            {recentlyTagged.map((r) => (
              <ResultCard key={r.id} restaurant={r} />
            ))}
          </div>
        ) : (
          <div className="tm-card tm-empty">
            <h3 style={{ fontSize: 19, fontWeight: 800 }}>Nothing tagged in {city} yet</h3>
            <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 380 }}>
              Pick another city from the header, or search for a place by name.
            </p>
          </div>
        )}
      </section>

      <EmailSignup source="home" />
    </div>
  );
}
