"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Logo from "./Logo";
import CityPicker from "./CityPicker";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * Identity, wherever it sits.
 *
 * Signed out it is the sign-in action; signed in it is the user chip pointing
 * at /profile. Profile is not a nav item — it means nothing to the signed-out
 * majority who make up most arrivals.
 */
function IdentityLink({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <span className="tm-skel" style={{ width: compact ? 44 : 92, height: 34 }} aria-hidden="true" />;
  }

  if (user) {
    const label = user.email ?? "You";
    const initial = label.trim().charAt(0).toUpperCase() || "Y";
    return (
      <Link
        href="/profile"
        className="tm-identity"
        aria-current={isNavItemActive("/profile", pathname) ? "page" : undefined}
      >
        <span className="tm-identity-avatar" aria-hidden="true">
          {initial}
        </span>
        {compact ? null : <span className="tm-identity-name">{label}</span>}
      </Link>
    );
  }

  return (
    <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="tm-identity-signin">
      Sign in
    </Link>
  );
}

/**
 * Top bar.
 *
 * Under 768 it carries the lockup, search and city; navigation lives in the
 * bottom tab bar. From 768 it also carries the nav itself, which is why there
 * is no sidebar — four destinations do not warrant a 240px column, and one bar
 * per breakpoint is far less to keep correct than a drawer, an icon rail and a
 * sidebar all at once.
 */
export function TopBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Keyed on the query so the field reflects the search you're looking at,
  // while staying uncontrolled between navigations.
  const currentQuery = searchParams.get("q") ?? "";

  return (
    <header className="tm-topbar">
      <div className="tm-topbar-inner">
        <Logo iconSize={30} wordmarkHeight={15} />

        <nav className="tm-topnav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="tm-topnav-item"
              aria-current={isNavItemActive(item.href, pathname) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form className="tm-topbar-search" action="/search" role="search">
          <input
            key={currentQuery}
            className="tm-topbar-input"
            name="q"
            type="search"
            defaultValue={currentQuery}
            placeholder="Search restaurants, lists, or tags"
            aria-label="Search restaurants, lists, or tags"
          />
        </form>

        <CityPicker />

        <span className="tm-topbar-identity">
          <IdentityLink />
        </span>
      </div>
    </header>
  );
}

/**
 * Bottom tab bar, under 768 only.
 *
 * Five thumb-reachable destinations, labelled — someone arriving cold on a
 * restaurant page from search can see what the product is without opening
 * anything. Padded for the iOS home indicator via safe-area-inset.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tm-tabbar" aria-label="Main">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="tm-tab"
            aria-current={active ? "page" : undefined}
          >
            <span className="tm-tab-dot" aria-hidden="true" />
            <span className="tm-tab-label">{item.label}</span>
          </Link>
        );
      })}
      <span className="tm-tab tm-tab-identity">
        <IdentityLink compact />
      </span>
    </nav>
  );
}
