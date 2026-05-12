import Link from "next/link";

const USERS = [
  { id: 8421, email: "james@example.com", provider: "google", signedUp: "2026-01-03", restaurants: 47, lists: 12, lastSeen: "2h ago" },
  { id: 8420, email: "sarah@example.com", provider: "apple", signedUp: "2026-01-02", restaurants: 23, lists: 5, lastSeen: "4h ago" },
  { id: 8419, email: "mike@example.com", provider: "google", signedUp: "2025-12-31", restaurants: 91, lists: 18, lastSeen: "1d ago" },
  { id: 8418, email: "priya@example.com", provider: "apple", signedUp: "2025-12-30", restaurants: 12, lists: 3, lastSeen: "2d ago" },
  { id: 8417, email: "alex@example.com", provider: "email", signedUp: "2025-12-29", restaurants: 5, lists: 1, lastSeen: "5d ago" },
  { id: 8416, email: "nina@example.com", provider: "google", signedUp: "2025-12-28", restaurants: 38, lists: 9, lastSeen: "1w ago" },
];

const FILTERS = ["all", "signed up <7d", "no restaurants saved", "oauth: google", "oauth: apple"];

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

export default function UsersPage() {
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
          { label: "users.tsx", active: true, href: "/admin/users" },
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
        {/* Shell prompt */}
        <div style={{ color: "var(--tm-muted)", marginBottom: 14, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm users --filter recent
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {FILTERS.map((f, i) => (
            <span
              key={f}
              style={{
                fontSize: 10.5,
                padding: "2px 8px",
                border: "1px solid var(--tm-line)",
                borderRadius: 3,
                background: i === 0 ? "var(--tm-accent-bg)" : "transparent",
                color: i === 0 ? "var(--tm-accent)" : "var(--tm-muted)",
                cursor: "pointer",
                fontFamily: "var(--font-jetbrains-mono), monospace",
              }}
            >
              [{f}]
            </span>
          ))}
        </div>

        {/* Header */}
        <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
          # users · 12,847
        </div>

        {/* Table */}
        <div
          style={{
            background: "var(--tm-panel)",
            border: "1px solid var(--tm-line)",
            borderRadius: 6,
          }}
        >
          {/* Header row */}
          <TRow>
            <span style={{ color: "var(--tm-muted)", display: "flex", gap: 0, width: "100%" }}>
              <span style={{ width: 56 }}>ID</span>
              <span style={{ flex: 1 }}>EMAIL</span>
              <span style={{ width: 80 }}>PROVIDER</span>
              <span style={{ width: 96 }}>SIGNED UP</span>
              <span style={{ width: 72 }}>RESTS</span>
              <span style={{ width: 56 }}>LISTS</span>
              <span style={{ width: 80 }}>LAST SEEN</span>
            </span>
          </TRow>
          {USERS.map((u, i) => (
            <TRow key={u.id} last={i === USERS.length - 1}>
              <span style={{ width: 56, color: "var(--tm-muted)" }}>
                {u.id}
              </span>
              <span style={{ flex: 1 }}>{u.email}</span>
              <span style={{ width: 80, color: "var(--tm-muted)" }}>
                {u.provider}
              </span>
              <span style={{ width: 96, color: "var(--tm-muted)" }}>
                {u.signedUp}
              </span>
              <span style={{ width: 72 }}>{u.restaurants}</span>
              <span style={{ width: 56 }}>{u.lists}</span>
              <span style={{ width: 80, color: "var(--tm-muted)" }}>
                {u.lastSeen}
              </span>
            </TRow>
          ))}
        </div>
      </div>
    </div>
  );
}
