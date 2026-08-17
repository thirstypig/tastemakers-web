import type { ReactNode } from "react";
import Logo from "@/features/shell/Logo";
import TagChip from "@/features/tags/TagChip";
import "@/features/auth/auth.css";

/**
 * Full-page auth shell.
 *
 * Mobile: a purple strip carrying the lockup, then a white sheet.
 * Desktop: purple left panel with the pitch and a tag cloud, white form
 * panel on the right.
 */
const CLOUD = [
  "Would Recommend",
  "worth the wait",
  "tiny room",
  "Great Service",
  "cash only",
  "Authentic",
  "best birria in town",
  "Short Wait",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tm-app tm-auth">
      <aside className="tm-auth-panel">
        <Logo />
        <div className="tm-auth-pitch">
          <h2>Reviews in words. Not stars.</h2>
          <p>
            Five stars never told you whether the room is loud, the wait is long,
            or the birria is worth the drive.
          </p>
          <div className="tm-auth-cloud">
            {CLOUD.map((t) => (
              <TagChip key={t} label={t} variant="onPurple" size="desktop" />
            ))}
          </div>
        </div>
      </aside>

      <main className="tm-auth-form">{children}</main>
    </div>
  );
}
