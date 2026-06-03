import type { ReactNode } from "react";
import Link from "next/link";
import { NavAuth } from "./NavAuth";
import { Analytics } from "@/components/Analytics";
import { PrivacySettings } from "@/components/PrivacySettings";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-roboto), system-ui, sans-serif",
        background: "#1A1038",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <Analytics />
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header
      style={{
        background: "#2A1A60",
        borderBottom: "1px solid #3D2E6E",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/lists"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <LogoMark />
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            TASTEMAKERS
          </span>
        </Link>

        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          <NavLink href="/tastemakers">Tastemakers</NavLink>
          <NavLink href="/lists">Lists</NavLink>
          <NavLink href="/restaurants">Restaurants</NavLink>
          <NavAuth />
        </div>
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="pub-nav-link"
    >
      {children}
    </Link>
  );
}

function LogoMark() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="#DB1657" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#fff"
        fontSize="14"
        fontWeight="700"
        fontFamily="var(--font-roboto), sans-serif"
      >
        TM
      </text>
    </svg>
  );
}

function Footer() {
  return (
    <footer
      style={{
        background: "#2A1A60",
        borderTop: "1px solid #3D2E6E",
        padding: "48px 24px",
        marginTop: 80,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 32,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <LogoMark />
            <span
              style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}
            >
              TASTEMAKERS
            </span>
          </div>
          <p style={{ color: "#8b81a3", fontSize: 14, maxWidth: 260 }}>
            Discover restaurants through people whose taste you trust.
          </p>
        </div>
        <div style={{ display: "flex", gap: 48 }}>
          <FooterCol
            title="Discover"
            links={[
              { label: "Tastemakers", href: "/tastemakers" },
              { label: "Lists", href: "/lists" },
              { label: "Restaurants", href: "/restaurants" },
            ]}
          />
          <FooterCol
            title="App"
            links={[
              {
                label: "iOS App",
                href: "https://apps.apple.com/app/id1573533249",
              },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[{ label: "Privacy Policy", href: "/privacy" }]}
          />
        </div>
      </div>
      <div
        style={{
          maxWidth: 1200,
          margin: "32px auto 0",
          paddingTop: 24,
          borderTop: "1px solid #3D2E6E",
          color: "#8b81a3",
          fontSize: 13,
        }}
      >
        © {new Date().getFullYear()} Tastemakers. All rights reserved.
        {" · "}
        <Link href="/privacy" style={{ color: "#8b81a3", textDecoration: "none" }}>
          Privacy
        </Link>
        {" · "}
        <PrivacySettings />
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p
        style={{
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{ color: "#8b81a3", textDecoration: "none", fontSize: 14 }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
