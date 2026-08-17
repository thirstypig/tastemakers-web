import "./photos.css";
import Image from "next/image";
import type { RestaurantPhoto } from "@/lib/api/types";

/** 2-up on mobile, 4-up on desktop, most-hearted first, count overlaid. */
export default function PhotoGrid({
  photos,
  restaurantName,
}: {
  photos: RestaurantPhoto[];
  restaurantName: string;
}) {
  return (
    <div className="tm-photogrid">
      {photos.map((p) => (
        <figure key={p.id} className="tm-photocell">
          <Image
            src={p.url}
            alt={`${restaurantName} photo`}
            fill
            sizes="(max-width: 1023px) 50vw, 240px"
            style={{ objectFit: "cover" }}
          />
          <figcaption className="tm-photocell-hearts">
            <span aria-hidden="true">♡</span> {p.hearts ?? 0}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
