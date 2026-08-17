import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseIdFromSlug } from "@/lib/slug";
import Link from "next/link";
import { getRestaurantDetail, getRestaurantPhotos } from "@/features/restaurants/api";
import PhotoGrid from "@/features/restaurants/PhotoGrid";
import UploadPhotoBar from "@/features/restaurants/UploadPhotoBar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRestaurantDetail(parseIdFromSlug(slug) ?? "");
  if (!r) return { title: "Not Found" };
  return {
    title: `${r.name} photos — Tastemakers`,
    description: `Photos of ${r.name}, ${r.address}.`,
    alternates: { canonical: `https://app.tastemakersapp.com/restaurants/${r.slug}/photos` },
  };
}

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [restaurant, photos] = await Promise.all([
    getRestaurantDetail(parseIdFromSlug(slug) ?? ""),
    getRestaurantPhotos(parseIdFromSlug(slug) ?? ""),
  ]);
  if (!restaurant) notFound();

  return (
    <div className="tm-photos">
      <header className="tm-photos-head">
        <Link href={`/restaurants/${restaurant.slug}`} className="tm-photos-back">
          ‹ <span>{restaurant.name}</span>
        </Link>
        <h1 className="tm-photos-title">Photos</h1>
      </header>

      {photos.length > 0 ? (
        <PhotoGrid photos={photos} restaurantName={restaurant.name} />
      ) : (
        <div className="tm-card tm-empty">
          <h2 style={{ fontSize: 19, fontWeight: 800 }}>No photos yet</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 380 }}>
            Nobody has added a photo of {restaurant.name}. Be the first.
          </p>
        </div>
      )}

      <UploadPhotoBar />
    </div>
  );
}
