import Link from "next/link";
import Image from "next/image";
import type { RestaurantDetail } from "@/lib/api/types";
import PhotoCarousel from "./PhotoCarousel";
import RankedTagCloud from "@/features/tags/RankedTagCloud";
import FirstVisitExplainer from "@/features/tags/FirstVisitExplainer";
import YourTagsCard from "@/features/tags/YourTagsCard";
import { AdUnit } from "@/components/AdUnit";
import { AD_SLOTS } from "@/lib/ads";
import "./detail.css";

function mapsUrl(r: RestaurantDetail): string {
  const q =
    r.latitude && r.longitude ? `${r.latitude},${r.longitude}` : `${r.name} ${r.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function websiteHref(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function websiteLabel(website: string): string {
  return website.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

const iconButton = {
  background: "none",
  border: 0,
  color: "inherit",
  fontSize: "inherit",
  cursor: "pointer",
  padding: 0,
  lineHeight: 1,
} as const;

/**
 * The restaurant detail view.
 *
 * Extracted from the page so the ramp preview can render the real thing with
 * different tag counts, rather than a copy that drifts out of sync.
 */
export default function RestaurantDetailView({
  restaurant: r,
  banner,
}: {
  restaurant: RestaurantDetail;
  banner?: React.ReactNode;
}) {
  const hasContact = Boolean(r.phone ?? r.website);

  return (
    <div className="tm-detail">
      <div className="tm-detail-main">
        {banner}

        <PhotoCarousel photos={r.photos} fallbackUrl={r.imageUrl} name={r.name} slug={r.slug} />

        {/* Info card */}
        <div className="tm-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <h1 className="tm-detail-name">{r.name}</h1>
            <div style={{ display: "flex", gap: 14, paddingTop: 3, color: "#9A94A6", fontSize: 17 }}>
              <button type="button" aria-label="Share" style={iconButton}>
                ⤴
              </button>
              <button type="button" aria-label="Bookmark" style={iconButton}>
                ♡
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span aria-hidden="true" style={{ color: "var(--tm-crimson)", fontSize: 14, lineHeight: 1.4 }}>
              ◉
            </span>
            <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--tm-muted)" }}>{r.address}</span>
          </div>

          {/* Phone and website render only when the row is populated. Both
              columns exist but are empty for every restaurant in production,
              so an unconditional row would be a permanently blank line. */}
          {hasContact ? (
            <>
              <div className="tm-hairline" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {r.phone ? (
                  <a className="tm-link" href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} style={{ fontSize: 15 }}>
                    {r.phone}
                  </a>
                ) : null}
                {r.website ? (
                  <a
                    className="tm-link"
                    href={websiteHref(r.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 15 }}
                  >
                    {websiteLabel(r.website)}
                  </a>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        {/* Ranked cloud — always fully visible, signed in or not. Levels come
            from the iOS rule (gap from this restaurant's leading tag); the
            vote action is what's gated, never the content. */}
        <RankedTagCloud
          restaurantId={r.slug}
          tags={r.tags.map((t) => ({ id: t.id, name: t.name, count: t.count ?? 1 }))}
        />

        <FirstVisitExplainer />

        <YourTagsCard
          restaurantId={r.slug}
          restaurantTags={r.tags.map((t) => ({ id: t.id, name: t.name }))}
        />

        {/* Carried over from the page this replaces. Renders nothing while
            ADS_ENABLED is false; dropping it would silently lose the slot
            when AdSense is approved. */}
        <AdUnit slot={AD_SLOTS.detailFooter} />
      </div>

      {/* Desktop right rail */}
      <aside className="tm-detail-rail">
        <div className="tm-card" style={{ overflow: "hidden" }}>
          <div
            style={{
              height: 170,
              background: "#D6D2DE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#8E8A9B",
              fontSize: 13,
            }}
          >
            Map
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 14, color: "var(--tm-muted)" }}>{r.city}</span>
            <a className="tm-link" href={mapsUrl(r)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14 }}>
              Get directions
            </a>
          </div>
        </div>

        {r.onLists.length > 0 ? (
          <div className="tm-card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="tm-rail-label">ON THESE LISTS</span>
            {r.onLists.map((l) => (
              <Link
                key={l.id}
                href={`/lists/${l.slug}`}
                style={{ display: "flex", gap: 10, alignItems: "center", textDecoration: "none" }}
              >
                <Image
                  src={l.thumbnailUrl}
                  alt=""
                  width={36}
                  height={36}
                  style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", flex: "none" }}
                />
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--tm-purple)" }}>{l.title}</span>
                  <span style={{ fontSize: 12, color: "var(--tm-muted)" }}>{l.meta}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
