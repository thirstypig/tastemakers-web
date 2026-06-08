import Link from "next/link";

// GA4 measurement ID is hardcoded in src/components/Analytics.tsx
const GA_ID = "G-062TFF0ZGE";
const POSTHOG_PROJECT_ID = "455919";
const POSTHOG_HOST = "https://us.posthog.com";

type EventRow = [string, number];

async function fetchPostHogEvents(apiKey: string): Promise<EventRow[] | null> {
  try {
    const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query:
            "SELECT event, count(*) AS total FROM events " +
            "WHERE toDate(timestamp) >= today() - 7 " +
            "GROUP BY event ORDER BY total DESC LIMIT 15",
        },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results as EventRow[]) ?? null;
  } catch {
    return null;
  }
}

function TRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      style={{
        padding: "7px 14px",
        borderBottom: last ? "none" : "1px solid var(--tm-line)",
        fontSize: 11.5,
        color: "var(--tm-ink)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        display: "flex",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
}

export default async function AnalyticsPage() {
  const posthogWriteKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  const posthogEvents = posthogApiKey
    ? await fetchPostHogEvents(posthogApiKey)
    : null;

  const SERVICES = [
    {
      id: "ga4",
      name: "Google Analytics 4",
      desc: `pageviews · sessions · acquisition · measurement id: ${GA_ID}`,
      status: "active" as const,
      note: null,
    },
    {
      id: "plausible",
      name: "Plausible",
      desc: "pageviews · sessions · privacy-first · domain: app.tastemakersapp.com",
      status: "active" as const,
      note: null,
    },
    {
      id: "posthog",
      name: "PostHog",
      desc: `product analytics · session replay · feature flags · project: ${POSTHOG_PROJECT_ID}`,
      status: (posthogWriteKey ? "active" : "needs_key") as "active" | "needs_key",
      note: posthogWriteKey
        ? null
        : "Add NEXT_PUBLIC_POSTHOG_KEY to .env.local to enable tracking",
    },
    {
      id: "search-console",
      name: "Search Console",
      desc: "impressions · clicks · keywords · indexing · verified via meta tag",
      status: "verified" as const,
      note: null,
    },
  ];

  function statusStyle(s: string): { label: string; color: string } {
    if (s === "active") return { label: "● active", color: "var(--tm-accent)" };
    if (s === "verified") return { label: "● verified", color: "var(--tm-accent)" };
    if (s === "needs_key") return { label: "○ needs setup", color: "var(--tm-warn)" };
    return { label: "○ not connected", color: "var(--tm-muted)" };
  }

  return (
    <div>
      {/* Tab strip */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--tm-line)",
          background: "var(--tm-panel)",
          fontSize: 11,
          fontFamily: "var(--font-jetbrains-mono), monospace",
        }}
      >
        {[
          { label: "analytics.tsx", active: true, href: "/admin/analytics" },
          { label: "overview.tsx", active: false, href: "/admin" },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            style={{
              padding: "7px 14px",
              borderRight: "1px solid var(--tm-line)",
              color: tab.active ? "var(--tm-ink)" : "var(--tm-muted)",
              background: tab.active ? "var(--tm-bg)" : "transparent",
              fontWeight: tab.active ? 600 : 400,
              textDecoration: "none",
              display: "block",
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
        <div style={{ color: "var(--tm-muted)", marginBottom: 16, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm analytics --status
        </div>

        {/* Service status cards */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
            # services
          </div>
          <div
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              borderRadius: 6,
            }}
          >
            {SERVICES.map((s, i) => {
              const st = statusStyle(s.status);
              return (
                <TRow key={s.id} last={i === SERVICES.length - 1}>
                  <span style={{ display: "inline-block", width: 200, color: "var(--tm-ink)", fontWeight: 600 }}>
                    {s.name}
                  </span>
                  <span style={{ display: "inline-block", width: 130, color: st.color, fontWeight: 600 }}>
                    {st.label}
                  </span>
                  <span style={{ flex: 1, color: "var(--tm-muted)", fontSize: 10.5 }}>
                    {s.note ?? s.desc}
                  </span>
                </TRow>
              );
            })}
          </div>
        </div>

        {/* PostHog event counts — only if personal API key is set */}
        {posthogApiKey ? (
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
              # posthog · event counts · last 7 days
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
              }}
            >
              {posthogEvents === null ? (
                <TRow last>
                  <span style={{ color: "var(--tm-err)" }}>query failed — check POSTHOG_PERSONAL_API_KEY</span>
                </TRow>
              ) : posthogEvents.length === 0 ? (
                <TRow last>
                  <span style={{ color: "var(--tm-muted)" }}>no events in last 7 days</span>
                </TRow>
              ) : (
                <>
                  <TRow>
                    <span style={{ color: "var(--tm-muted)", width: 260 }}>EVENT</span>
                    <span style={{ color: "var(--tm-muted)", width: 80 }}>COUNT</span>
                    <span style={{ color: "var(--tm-muted)" }}>BAR</span>
                  </TRow>
                  {posthogEvents.map(([event, count], i) => {
                    const max = posthogEvents[0][1] ?? 1;
                    const pct = Math.round((count / max) * 120);
                    return (
                      <TRow key={event} last={i === posthogEvents.length - 1}>
                        <span style={{ width: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {event}
                        </span>
                        <span style={{ width: 80, fontWeight: 600 }}>
                          {count.toLocaleString()}
                        </span>
                        <span>
                          <span
                            style={{
                              display: "inline-block",
                              height: 6,
                              width: pct,
                              background: "var(--tm-accent)",
                              borderRadius: 2,
                              opacity: 0.65,
                              minWidth: 2,
                            }}
                          />
                        </span>
                      </TRow>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
              # posthog · event counts
            </div>
            <div
              style={{
                background: "var(--tm-panel)",
                border: "1px solid var(--tm-line)",
                borderRadius: 6,
                padding: "14px",
              }}
            >
              <div style={{ fontSize: 11.5, color: "var(--tm-muted)" }}>
                Add{" "}
                <span style={{ color: "var(--tm-accent)" }}>POSTHOG_PERSONAL_API_KEY</span>
                {" "}to .env.local to query event counts.
              </div>
              <div style={{ fontSize: 10.5, color: "var(--tm-muted)", marginTop: 6 }}>
                Generate at posthog.com → Settings → Personal API keys → Read access
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
