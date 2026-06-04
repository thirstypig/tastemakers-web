"use client";

import { useState } from "react";
import Link from "next/link";

const ROADMAP_ITEMS = [
  // P1
  { phase: "P1", title: "Auth on delete endpoints", owner: "backend", status: "in_progress", date: "2026-05-04" },
  { phase: "P1", title: "Apple Sign-In JWT verify", owner: "backend", status: "open", date: "2026-05-04" },
  { phase: "P1", title: "IDOR — drop user_id from body", owner: "backend", status: "in_progress", date: "2026-05-04" },
  { phase: "P1", title: "Remove debug routes from production", owner: "backend", status: "open", date: "2026-05-11" },
  { phase: "P1", title: "FCM key regression in UserController", owner: "backend", status: "open", date: "2026-05-11" },
  { phase: "P1", title: "Web admin login token path mismatch", owner: "web", status: "open", date: "2026-05-11" },
  { phase: "P1", title: "getallBadges hardcoded user_id=43", owner: "backend", status: "open", date: "2026-05-11" },
  // P2
  { phase: "P2", title: "Privacy policy + GA4/AdSense consent", owner: "web", status: "done", date: "2026-06-03" },
  { phase: "P2", title: "Marketing site content for AdSense approval", owner: "web", status: "open", date: "2026-06-03" },
  { phase: "P2", title: "Form Request validation", owner: "backend", status: "open", date: "" },
  { phase: "P2", title: "Move token to Keychain", owner: "ios", status: "open", date: "" },
  { phase: "P2", title: "Rate limit auth endpoints", owner: "backend", status: "open", date: "" },
  { phase: "P2", title: "API exception handler commented out", owner: "backend", status: "open", date: "" },
  { phase: "P2", title: "Passport token TTL never set (1yr default)", owner: "backend", status: "open", date: "" },
  { phase: "P2", title: "Android tag/follow request wrong fields", owner: "android", status: "open", date: "" },
  // P3
  { phase: "P3", title: "Place AdSense ad units (post-approval)", owner: "web", status: "open", date: "2026-06-03" },
  { phase: "P3", title: "Bulk rename complition→completion", owner: "ios", status: "open", date: "" },
  { phase: "P3", title: "Haversine into shared scope", owner: "backend", status: "open", date: "" },
  { phase: "P3", title: "iOS multipart double boundary", owner: "ios", status: "open", date: "" },
  { phase: "P3", title: "web.php dead code cleanup", owner: "backend", status: "open", date: "" },
];

type Status = "open" | "in_progress" | "done";

const STATUS_ICON: Record<Status, string> = {
  open: "○",
  in_progress: "◐",
  done: "●",
};

function phaseColor(phase: string) {
  if (phase === "P1") return "var(--tm-err)";
  if (phase === "P2") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

function ownerColor(owner: string) {
  if (owner === "backend") return "var(--tm-muted)";
  if (owner === "ios") return "var(--tm-accent)";
  if (owner === "android") return "var(--tm-warn)";
  if (owner === "web") return "var(--tm-muted)";
  return "var(--tm-muted)";
}

export default function RoadmapPage() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    P1: true,
    P2: false,
    P3: false,
  });

  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(ROADMAP_ITEMS.map((_, i) => [i, _.status as Status])),
  );

  function cycleStatus(idx: number) {
    setStatuses((prev) => {
      const cur = prev[idx];
      const next: Status =
        cur === "open" ? "in_progress" : cur === "in_progress" ? "done" : "open";
      return { ...prev, [idx]: next };
    });
  }

  function statusColor(s: Status) {
    if (s === "done") return "var(--tm-accent)";
    if (s === "in_progress") return "var(--tm-warn)";
    return "var(--tm-muted)";
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
          { label: "roadmap.md", active: true, href: "/admin/roadmap" },
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
          <span style={{ color: "var(--tm-accent)" }}>$</span> cat roadmap.md
        </div>

        {(["P1", "P2", "P3"] as const).map((phase) => {
          const items = ROADMAP_ITEMS
            .map((r, i) => ({ ...r, idx: i }))
            .filter((r) => r.phase === phase);
          const isOpen = open[phase];

          return (
            <div key={phase} style={{ marginBottom: 14 }}>
              {/* Accordion header */}
              <button
                onClick={() => setOpen((o) => ({ ...o, [phase]: !o[phase] }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "7px 14px",
                  background: "var(--tm-panel)",
                  border: "1px solid var(--tm-line)",
                  borderRadius: isOpen ? "6px 6px 0 0" : 6,
                  cursor: "pointer",
                  color: "var(--tm-ink)",
                  fontSize: 11.5,
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  textAlign: "left",
                }}
              >
                <span>{isOpen ? "▾" : "▸"}</span>
                <span style={{ color: phaseColor(phase), fontWeight: 600 }}>
                  [{phase}]
                </span>
                <span>
                  {phase === "P1" ? "critical" : phase === "P2" ? "important" : "nice-to-have"}
                </span>
                <span style={{ color: "var(--tm-muted)" }}>({items.length})</span>
              </button>

              {/* Items */}
              {isOpen && (
                <div
                  style={{
                    border: "1px solid var(--tm-line)",
                    borderTop: "none",
                    borderRadius: "0 0 6px 6px",
                    background: "var(--tm-panel)",
                  }}
                >
                  {items.map((r, i) => {
                    const s = statuses[r.idx];
                    return (
                      <div
                        key={r.idx}
                        style={{
                          padding: "7px 14px",
                          borderBottom:
                            i === items.length - 1
                              ? "none"
                              : "1px solid var(--tm-line)",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          fontSize: 11.5,
                        }}
                      >
                        {/* Status toggle */}
                        <button
                          onClick={() => cycleStatus(r.idx)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: statusColor(s),
                            fontSize: 12,
                            padding: 0,
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                          }}
                          title="Click to cycle status"
                        >
                          {STATUS_ICON[s]}
                        </button>

                        <span style={{ flex: 1, color: "var(--tm-ink)" }}>
                          {r.title}
                        </span>

                        <span style={{ color: ownerColor(r.owner), fontSize: 10.5 }}>
                          {r.owner}
                        </span>

                        {r.date && (
                          <span style={{ color: "var(--tm-muted)", fontSize: 10.5 }}>
                            {r.date}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
