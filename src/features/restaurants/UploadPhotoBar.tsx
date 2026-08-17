"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * The crimson UPLOAD YOUR PHOTO bar.
 *
 * Signed out it prompts sign-in, matching the gating rule used everywhere else.
 *
 * Signed in it is disabled with a reason rather than wired up, because the
 * only upload path that exists — the Laravel `restaurant-image-save` endpoint —
 * writes files to `public_path('storage/res_image')`, i.e. the container's
 * local disk. Railway's filesystem is ephemeral, so an accepted upload is lost
 * on the next deploy or restart. Shipping a working-looking button on top of
 * that would destroy the photo and tell the user it succeeded.
 */
export default function UploadPhotoBar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div className="tm-uploadbar-slot" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="tm-uploadbar-slot">
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="tm-btn tm-btn-primary tm-uploadbar"
        >
          Sign in to add a photo
        </Link>
      </div>
    );
  }

  return (
    <div className="tm-uploadbar-slot">
      <button type="button" className="tm-btn tm-btn-primary tm-uploadbar" disabled>
        Upload your photo
      </button>
      <p className="tm-uploadbar-note">
        Photo upload is turned off until photos have somewhere durable to live —
        the current endpoint writes to the container disk, which Railway wipes on
        every deploy.
      </p>
    </div>
  );
}
