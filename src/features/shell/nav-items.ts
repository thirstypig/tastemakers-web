/**
 * Nav destinations.
 *
 * Search is deliberately absent: the search field is in the sticky top bar on
 * every page and at every width, so a nav item pointing at /search would be a
 * second door to something already on screen.
 *
 * Profile is absent too — identity lives in the sidebar's bottom slot, which
 * is the sign-in CTA when signed out and the user chip when signed in.
 */
export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Cuisines", href: "/cuisines" },
  { label: "Lists", href: "/lists" },
  { label: "Bookmarks", href: "/bookmarks" },
] as const;

/**
 * Whether a nav item is the active one for a given pathname.
 *
 * "/" only matches exactly — otherwise every route would light up Home.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
