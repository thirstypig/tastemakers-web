import "./result-card.css";
import Image from "next/image";
import Link from "next/link";
import RankedTagChip from "@/features/tags/RankedTagChip";
import { assignTagLevels } from "@/features/tags/levels";
import type { Restaurant } from "@/lib/api/types";

/**
 * The app's result card: name, full address in --tm-faint, bookmark heart,
 * and the tag strip on --tm-strip. Desktop adds a 150px photo on the left.
 *
 * Used by search results and the restaurants index so both stay identical.
 */
export default function ResultCard({ restaurant }: { restaurant: Restaurant }) {
  // Cards show only the top two levels — the ramp does the summarising, so a
  // card never needs a rating number. Everything below is folded into "+N".
  const levelled = assignTagLevels(restaurant.tags);
  const strong = levelled.filter((t) => t.level <= 2).slice(0, 3);
  const overflow = levelled.length - strong.length;

  return (
    <article className="tm-result">
      <Link href={`/restaurants/${restaurant.slug}`} className="tm-result-photo" aria-hidden="true" tabIndex={-1}>
        <Image
          src={restaurant.imageUrl}
          alt=""
          fill
          sizes="150px"
          style={{ objectFit: "cover" }}
        />
      </Link>

      <div className="tm-result-body">
        <div className="tm-result-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
            <Link href={`/restaurants/${restaurant.slug}`} className="tm-result-name">
              {restaurant.name}
            </Link>
            <span className="tm-result-addr">{restaurant.address}</span>
          </div>
          <button type="button" className="tm-result-heart" aria-label={`Bookmark ${restaurant.name}`}>
            ♡
          </button>
        </div>

        {strong.length > 0 ? (
          <div className="tm-result-strip">
            {strong.map((t) => (
              <RankedTagChip key={t.id} label={t.name} level={t.level} />
            ))}
            {overflow > 0 ? (
              <span className="tm-result-more">+{overflow}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
