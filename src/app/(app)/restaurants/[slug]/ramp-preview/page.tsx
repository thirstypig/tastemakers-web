import { notFound } from "next/navigation";
import { parseIdFromSlug } from "@/lib/slug";
import Link from "next/link";
import { getRestaurantDetail } from "@/features/restaurants/api";
import RestaurantDetailView from "@/features/restaurants/RestaurantDetailView";
import { assignTagLevels } from "@/features/tags/levels";

/**
 * The real restaurant page, with tag counts that vary.
 *
 * Production cannot show the ramp: `UNIQUE (restaurant_id, tag_id)` allows one
 * row per pair, so every tag on every one of the 1,388 restaurants has exactly
 * one vote — verified, zero restaurants have any spread. Every tag therefore
 * ties for the lead and levels to L1. That is the constraint's doing, not the
 * ramp's, and fixing the constraint will not retroactively help either: the
 * duplicate rows that held the original counts were deleted by the migration
 * that added it.
 *
 * So this route renders the same `RestaurantDetailView` as the live page,
 * against the same real restaurant and its real tags, substituting synthetic
 * counts so the levels separate. Dev-only.
 */

/** Counts that produce a full L1→L5 spread across however many tags exist. */
function spreadCounts<T>(tags: readonly T[]): Array<T & { count: number }> {
  return tags.map((t, i) => ({ ...t, count: Math.max(1, 9 - Math.floor(i / 2)) }));
}

export default async function RampPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { slug } = await params;
  const r = await getRestaurantDetail(parseIdFromSlug(slug) ?? "");
  if (!r) notFound();

  const withSpread = assignTagLevels(spreadCounts(r.tags)).map((t) => ({
    id: t.id,
    name: t.name,
    level: t.level,
    count: t.count,
  }));

  const banner = (
    <div className="tm-card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
      <strong style={{ fontSize: 14, color: "var(--tm-crimson)" }}>
        Preview — synthetic vote counts
      </strong>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#6F6A80" }}>
        {r.name}&apos;s real tags, with counts spread 9 → 2 so the five levels
        separate. In production every count is 1, so every tag ties for the lead
        and renders at L1 — see{" "}
        <Link href={`/restaurants/${r.slug}`} className="tm-link">
          the live page
        </Link>{" "}
        for the difference.
      </p>
    </div>
  );

  return <RestaurantDetailView restaurant={{ ...r, tags: withSpread }} banner={banner} />;
}
