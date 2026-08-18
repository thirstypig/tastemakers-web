import Link from "next/link";
import { APP_STORE_URL } from "./links";

/**
 * Persistent footer for the app shell.
 *
 * Exists because the App Store link was effectively unreachable: PitchBand
 * renders it only while signed OUT, FirstVisitExplainer only on a visitor's
 * first ever page and never again once dismissed, and the (public) layout's
 * footer covers only /privacy and /tastemakers. A signed-in user browsing
 * restaurants had no route to the iOS app at all.
 *
 * Server-rendered — no hooks, no auth check. It must appear for crawlers and
 * for signed-in users alike, which is the whole point.
 */
export default function SiteFooter() {
  return (
    <footer className="tm-footer">
      <div className="tm-footer-inner">
        <p className="tm-footer-pitch">
          Tagging is faster on the phone.{" "}
          <a
            className="tm-footer-cta"
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Tastemakers for iPhone
          </a>
        </p>
        <nav className="tm-footer-links" aria-label="Footer">
          <Link href="/restaurants">Restaurants</Link>
          <Link href="/lists">Lists</Link>
          <Link href="/cuisines">Cuisines</Link>
          <Link href="/tastemakers">Tastemakers</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
