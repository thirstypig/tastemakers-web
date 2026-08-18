import "./shell.css";
import type { ReactNode } from "react";
import { TabBar, TopBar } from "./AppNav";
import SiteFooter from "./SiteFooter";

/**
 * The app shell.
 *
 * Under 768: slim purple top bar (lockup, search, city) plus a bottom tab bar.
 * From 768: one purple top bar carrying navigation as well — no sidebar.
 *
 * Content is a single centred column, capped at 960px; cards are full width
 * rather than fanned into a grid, except for list and cuisine tiles.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="tm-app">
      <div className="tm-shell">
        <TopBar />
        <main className="tm-content">{children}</main>
        <SiteFooter />
        <TabBar />
      </div>
    </div>
  );
}
