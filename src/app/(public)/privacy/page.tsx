import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Tastemakers",
  description:
    "What Tastemakers collects, your consent choices, and your rights under GDPR and CCPA.",
  alternates: { canonical: "https://app.tastemakersapp.com/privacy" },
};

const PINK = "#DB1657";
const PURPLE_LT = "#B7ADCF";
const SURFACE = "#2A1A60";
const BORDER = "#3D2E6E";

export default function PrivacyPage() {
  return (
    <>
      <section
        style={{
          background: "linear-gradient(180deg, #3D296E 0%, #1A1038 100%)",
          padding: "72px 24px 56px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.03em",
            marginBottom: 12,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 15, color: PURPLE_LT }}>
          Last updated: June 3, 2026
        </p>
      </section>

      <article
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "48px 24px 24px",
          lineHeight: 1.7,
          fontSize: 16,
          color: "#E7E1F5",
        }}
      >
        <H2>What We Collect</H2>

        <H3>With Your Consent (Analytics)</H3>
        <P>
          We use <strong>Google Analytics 4</strong> (measurement ID{" "}
          <Code>G-062TFF0ZGE</Code>) to understand how visitors use the site —
          page views, session duration, device type, and general location
          (city-level). GA4 only loads if you accept Analytics in our consent
          banner.
        </P>
        <Ul>
          <li>Data retained: 14 months</li>
          <li>
            <A href="https://policies.google.com/privacy">
              Google&apos;s privacy policy
            </A>
          </li>
          <li>
            <A href="https://tools.google.com/dlpage/gaoptout">Opt out of GA4</A>
          </li>
        </Ul>

        <H3>With Your Consent (Advertising)</H3>
        <P>
          We use <strong>Google AdSense</strong> to show relevant ads that help
          fund the site. AdSense only loads if you accept Marketing in our
          consent banner.
        </P>
        <Ul>
          <li>
            <A href="https://policies.google.com/technologies/ads">
              Google&apos;s ad privacy policy
            </A>
          </li>
          <li>
            <A href="https://myaccount.google.com/data-and-privacy">
              Manage your Google ad settings
            </A>
          </li>
        </Ul>

        <Hr />

        <H2>Your Choices</H2>
        <P>You can change your consent preferences at any time:</P>
        <ol style={{ margin: "0 0 16px 22px", display: "grid", gap: 6 }}>
          <li>
            Open <strong>Privacy settings</strong> (the link in our footer) to
            reopen Google&apos;s consent message
          </li>
          <li>
            Choose <strong>Manage options</strong> to adjust your Analytics and
            Advertising consent
          </li>
          <li>Confirm to save your choices</li>
        </ol>

        <Hr />

        <H2>Your Rights</H2>
        <P>
          <strong>EU/UK residents (GDPR/PECR):</strong> You have the right to
          access, correct, delete, or export your data, and to withdraw consent
          at any time.
        </P>
        <P>
          <strong>California residents (CCPA/CPRA):</strong> You have the right
          to know what data is collected, request deletion, and opt out of data
          sharing.
        </P>
        <P>
          To exercise these rights, email:{" "}
          <A href="mailto:thetastemakersapp@gmail.com">
            thetastemakersapp@gmail.com
          </A>
        </P>

        <Hr />

        <H2>Cookies</H2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
              margin: "8px 0 16px",
            }}
          >
            <thead>
              <tr>
                <Th>Cookie</Th>
                <Th>Purpose</Th>
                <Th>Consent Required?</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>FCCDCF, FCNEC</Td>
                <Td>Stores your consent choice (Google Privacy and messaging)</Td>
                <Td>No (necessary)</Td>
              </tr>
              <tr>
                <Td>_ga, _ga_*</Td>
                <Td>Google Analytics 4 — usage measurement</Td>
                <Td>Yes (Analytics)</Td>
              </tr>
              <tr>
                <Td>__gads, __gpi, _gcl_au</Td>
                <Td>Google AdSense — ad delivery and frequency capping</Td>
                <Td>Yes (Advertising)</Td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>
          Exact cookie names may change as Google updates its services. You can
          also disable cookies in your browser settings; this may affect site
          functionality.
        </P>

        <Hr />

        <H2>Contact</H2>
        <P>
          Questions about this policy?
          <br />
          Email:{" "}
          <A href="mailto:thetastemakersapp@gmail.com">
            thetastemakersapp@gmail.com
          </A>
          <br />
          Site: tastemakersapp.com
          <br />
          Last updated: June 3, 2026
        </P>

        <div style={{ marginTop: 40 }}>
          <Link href="/" style={{ color: PINK, fontWeight: 600, textDecoration: "none" }}>
            ← Back to Tastemakers
          </Link>
        </div>
      </article>
    </>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 26,
        fontWeight: 800,
        color: "#fff",
        marginTop: 36,
        marginBottom: 14,
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: "#fff",
        marginTop: 26,
        marginBottom: 8,
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 14 }}>{children}</p>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ margin: "0 0 16px 22px", display: "grid", gap: 6 }}>
      {children}
    </ul>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      style={{ color: PINK, textDecoration: "none" }}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 4,
        padding: "1px 6px",
        fontSize: 14,
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      {children}
    </code>
  );
}

function Hr() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: `1px solid ${BORDER}`,
        margin: "32px 0",
      }}
    />
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        border: `1px solid ${BORDER}`,
        background: SURFACE,
        color: "#fff",
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "10px 12px",
        border: `1px solid ${BORDER}`,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}
