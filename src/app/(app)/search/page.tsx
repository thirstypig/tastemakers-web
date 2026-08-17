import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { searchAll } from "@/features/search/api";
import {
  SEARCH_SEGMENTS,
  isSearchSegment,
  segmentLabel,
  type SearchSegment,
} from "@/features/search/query";
import ResultCard from "@/features/restaurants/ResultCard";
import { DEFAULT_CITY } from "@/lib/api/cities";
import TagChip from "@/features/tags/TagChip";
import "@/features/search/search.css";

export const metadata: Metadata = {
  title: "Search — Tastemakers",
  description: "Search restaurants, lists and tags on Tastemakers.",
  // Query pages are not useful in an index.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; in?: string; city?: string }>;
}) {
  const { q = "", in: rawSegment, city: rawCity } = await searchParams;
  // "everywhere" is the explicit opt-out; no param means the picked city.
  const scope = rawCity === "everywhere" ? undefined : (rawCity ?? DEFAULT_CITY);
  const results = await searchAll(q, scope);
  const counts: Record<SearchSegment, number> = {
    restaurants: results.restaurants.length,
    lists: results.lists.length,
    tags: results.tags.length,
  };

  // Default to the first segment that actually has results, so a tag-only
  // match doesn't land the user on an empty Restaurants tab.
  const active: SearchSegment = isSearchSegment(rawSegment)
    ? rawSegment
    : (SEARCH_SEGMENTS.find((s) => counts[s] > 0) ?? "restaurants");

  if (!results.term) {
    return (
      <div className="tm-card tm-empty">
        <h1 style={{ fontSize: 21, fontWeight: 800 }}>Search Tastemakers</h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 360 }}>
          Find a restaurant by name or address, a curated list, or a tag like
          “Great Service”.
        </p>
      </div>
    );
  }

  const total = counts.restaurants + counts.lists + counts.tags;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <nav className="tm-segments" aria-label="Search scope">
        <Link
          href={`/search?q=${encodeURIComponent(results.term)}&in=${active}`}
          className="tm-segment"
          aria-current={results.city ? "true" : undefined}
        >
          In {results.city ?? DEFAULT_CITY}
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(results.term)}&in=${active}&city=everywhere`}
          className="tm-segment"
          aria-current={results.city ? undefined : "true"}
        >
          Everywhere
        </Link>
      </nav>

      <nav className="tm-segments" aria-label="Result type">
        {SEARCH_SEGMENTS.map((segment) => (
          <Link
            key={segment}
            href={`/search?q=${encodeURIComponent(results.term)}&in=${segment}${results.city ? "" : "&city=everywhere"}`}
            className="tm-segment"
            aria-current={segment === active ? "true" : undefined}
          >
            {segmentLabel(segment)} {counts[segment]}
          </Link>
        ))}
      </nav>

      {total === 0 ? (
        <div className="tm-card tm-empty">
          <h1 style={{ fontSize: 21, fontWeight: 800 }}>Nothing for “{results.term}”</h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 360 }}>
            Try a shorter term, or search by city — most places are listed with
            their full street address.
          </p>
        </div>
      ) : null}

      {active === "restaurants" && counts.restaurants > 0 ? (
        <div className="tm-results">
          {results.restaurants.map((r) => (
            <ResultCard key={r.id} restaurant={r} />
          ))}
        </div>
      ) : null}

      {active === "lists" && counts.lists > 0 ? (
        <div className="tm-results">
          {results.lists.map((l) => (
            <Link key={l.id} href={`/lists/${l.slug}`} className="tm-result" style={{ textDecoration: "none" }}>
              <span className="tm-result-photo">
                <Image src={l.thumbnailUrl} alt="" fill sizes="150px" style={{ objectFit: "cover" }} />
              </span>
              <span className="tm-result-body">
                <span className="tm-result-head">
                  <span style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                    <span className="tm-result-name">{l.title}</span>
                    <span className="tm-result-addr">{l.meta}</span>
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {active === "tags" && counts.tags > 0 ? (
        <div className="tm-card" style={{ padding: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {results.tags.map((t) => (
            <span key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <TagChip label={t.name} size="cloud" />
              <span style={{ fontSize: 13, color: "var(--tm-muted)" }}>
                {t.placeCount} {t.placeCount === 1 ? "place" : "places"}
              </span>
            </span>
          ))}
        </div>
      ) : null}

      {/* The chosen segment is empty but another one isn't. */}
      {total > 0 && counts[active] === 0 ? (
        <div className="tm-card tm-empty">
          <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
            No {segmentLabel(active).toLowerCase()} match “{results.term}”.
          </p>
        </div>
      ) : null}
    </div>
  );
}
