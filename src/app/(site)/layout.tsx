import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";

// Shell for the marketing + app-entry routes (/, /explore, /review).
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-roboto), system-ui, sans-serif",
        background: "#1A1038",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <Nav />
      <main>{children}</main>
    </div>
  );
}
