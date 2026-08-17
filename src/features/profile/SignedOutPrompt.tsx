"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Shared empty state for the signed-in-only screens. */
export default function SignedOutPrompt({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const pathname = usePathname();
  return (
    <div className="tm-card tm-empty">
      <h1 style={{ fontSize: 21, fontWeight: 800 }}>{title}</h1>
      <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)", maxWidth: 380 }}>{body}</p>
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="tm-btn tm-btn-primary"
        style={{ textDecoration: "none" }}
      >
        Sign in
      </Link>
    </div>
  );
}
