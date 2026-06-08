import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";

async function getUsers() {
  const db = createAdminClient();
  const { data } = await db
    .from("users")
    .select(
      "id, email, first_name, last_name, username, user_type, is_testmaker, last_login, created_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

type User = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  user_type: string | null;
  is_testmaker: number | null;
  last_login: string | null;
  created_at: string | null;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
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

export default async function UsersPage() {
  const users = await getUsers();

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
        <div style={{ color: "var(--tm-muted)", marginBottom: 14, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> tm users --limit 100
        </div>

        <div style={{ color: "var(--tm-muted)", marginBottom: 10, fontSize: 12 }}>
          # users · {users.length} shown · sorted by signup date
        </div>

        <div
          style={{
            background: "var(--tm-panel)",
            border: "1px solid var(--tm-line)",
            borderRadius: 6,
          }}
        >
          {/* Header */}
          <TRow>
            <span style={{ color: "var(--tm-muted)", display: "flex", width: "100%" }}>
              <span style={{ width: 56 }}>ID</span>
              <span style={{ flex: 1 }}>EMAIL</span>
              <span style={{ width: 130 }}>NAME</span>
              <span style={{ width: 110 }}>USERNAME</span>
              <span style={{ width: 70 }}>TYPE</span>
              <span style={{ width: 44 }}>TM</span>
              <span style={{ width: 90 }}>JOINED</span>
              <span style={{ width: 90 }}>LAST SEEN</span>
            </span>
          </TRow>

          {users.length === 0 ? (
            <TRow last>
              <span style={{ color: "var(--tm-muted)" }}>no users found</span>
            </TRow>
          ) : (
            users.map((u: User, i: number) => (
              <TRow key={u.id} last={i === users.length - 1}>
                <span style={{ width: 56, color: "var(--tm-muted)" }}>{u.id}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.email}
                </span>
                <span style={{ width: 130, color: "var(--tm-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                </span>
                <span style={{ width: 110, color: "var(--tm-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.username ?? "—"}
                </span>
                <span style={{ width: 70, color: "var(--tm-muted)" }}>
                  {u.user_type ?? "—"}
                </span>
                <span
                  style={{
                    width: 44,
                    color: u.is_testmaker ? "var(--tm-accent)" : "var(--tm-muted)",
                    fontWeight: u.is_testmaker ? 600 : 400,
                  }}
                >
                  {u.is_testmaker ? "★" : "—"}
                </span>
                <span style={{ width: 90, color: "var(--tm-muted)" }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}
                </span>
                <span style={{ width: 90, color: "var(--tm-muted)" }}>
                  {relativeTime(u.last_login)}
                </span>
              </TRow>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
