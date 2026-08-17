"use client";

import "./detail.css";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { RestaurantPhoto } from "@/lib/api/types";

/**
 * Swipeable photo carousel — dots below, grid button top-right.
 *
 * Swipe is native CSS scroll-snap rather than a gesture library: it gets
 * momentum, keyboard arrows and correct touch behaviour for free, and there
 * is no JS animation to suppress under prefers-reduced-motion. The only JS
 * here reads scrollLeft to highlight the active dot.
 */
export default function PhotoCarousel({
  photos,
  fallbackUrl,
  name,
  slug,
}: {
  photos: RestaurantPhoto[];
  fallbackUrl: string;
  name: string;
  slug: string;
}) {
  const slides = photos.length > 0 ? photos : [{ id: "cover", url: fallbackUrl }];
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === index ? prev : index));
  }, []);

  return (
    <div className="tm-carousel">
      <div
        ref={trackRef}
        className="tm-carousel-track"
        onScroll={onScroll}
        tabIndex={0}
        role="region"
        aria-label={`Photos of ${name}`}
      >
        {slides.map((p, i) => (
          <div key={p.id} className="tm-carousel-slide">
            <Image
              src={p.url}
              alt={i === 0 ? name : `${name} — photo ${i + 1}`}
              fill
              sizes="(max-width: 767px) 100vw, 640px"
              priority={i === 0}
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <>
          <Link
            href={`/restaurants/${slug}/photos`}
            className="tm-carousel-grid"
            aria-label={`See all ${slides.length} photos`}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} aria-hidden="true" />
            ))}
          </Link>

          <div className="tm-carousel-dots" aria-hidden="true">
            {slides.map((p, i) => (
              <span key={p.id} data-active={i === active ? "true" : undefined} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
