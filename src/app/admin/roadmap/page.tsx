"use client";

import { useState } from "react";
import Link from "next/link";
import { summarizeRoadmap } from "@/lib/admin-filters";
import type { Status, Phase, Platform, Milestone, PlatformRoadmap } from "@/lib/admin-filters";

const STATUS_ICON: Record<Status, string> = {
  open: "○",
  in_progress: "◐",
  done: "●",
};

const PLATFORM_ROADMAP: PlatformRoadmap[] = [
  {
    platform: "backend",
    label: "Backend / API",
    milestones: [
      { title: "Set FOURSQUARE_API_KEY in Railway env vars", phase: "P1", status: "open", date: "", detail: "/api/restaurants returns 500 without this key — core discovery feature is broken" },
      { title: "Remove debug routes from production", phase: "P1", status: "open", date: "", detail: "/debug-schema, /run-schema-fix, /debug-signup expose DB and can create users without auth" },
      { title: "Fix Apple Sign-In JWT verification", phase: "P1", status: "open", date: "", detail: "appleLogin() does not verify the JWT from Apple — any token is accepted" },
      { title: "Fix getallBadges hardcoded user_id=43", phase: "P1", status: "open", date: "", detail: "Any authenticated user can see badges for a hardcoded user instead of themselves" },
      { title: "Fix FCM key regression in UserController", phase: "P1", status: "open", date: "", detail: "Push notifications may be broken after the FCM key refactor" },
      { title: "Form Request validation on all endpoints", phase: "P2", status: "open", date: "" },
      { title: "Rate limit auth endpoints", phase: "P2", status: "open", date: "", detail: "Add throttle middleware to /login, /signup, /google-login" },
      { title: "Re-enable exception handler for JSON responses", phase: "P2", status: "open", date: "" },
      { title: "Set Passport token TTL (currently 1yr default)", phase: "P2", status: "open", date: "" },
      { title: "IDOR — drop user_id from request body", phase: "P1", status: "in_progress", date: "2026-05" },
      { title: "Auth on unauthenticated delete endpoints", phase: "P1", status: "in_progress", date: "2026-05" },
      { title: "Haversine distance into shared scope", phase: "P3", status: "open", date: "" },
      { title: "Dead code cleanup in web.php", phase: "P3", status: "open", date: "" },
    ],
  },
  {
    platform: "ios",
    label: "iOS",
    milestones: [
      { title: "Update API base URL → api.tastemakersapp.com", phase: "P1", status: "open", date: "", detail: "Constant.swift still points to legacy Namecheap host. Requires App Store submission after change." },
      { title: "Move auth token from UserDefaults to Keychain", phase: "P2", status: "open", date: "" },
      { title: "Fix multipart upload double boundary", phase: "P3", status: "open", date: "" },
      { title: "Rename complition → completion (typo throughout)", phase: "P3", status: "open", date: "" },
    ],
  },
  {
    platform: "android",
    label: "Android",
    milestones: [
      { title: "Add @HiltAndroidApp — app won't compile without it", phase: "P1", status: "open", date: "" },
      { title: "Remove premature Firebase / google-services deps", phase: "P1", status: "open", date: "", detail: "google-services.json is missing but Firebase deps are in build.gradle — compilation fails" },
      { title: "Fix tag/follow request field names", phase: "P2", status: "open", date: "", detail: "Wrong field names sent to API — doesn't match iOS or API contract" },
      { title: "Port iOS feature parity (auth, restaurants, lists)", phase: "P2", status: "open", date: "" },
    ],
  },
  {
    platform: "web",
    label: "Web App",
    milestones: [
      { title: "Complete auth flows (password reset, account mgmt)", phase: "P2", status: "open", date: "" },
      { title: "Build /profile page (auth-gated)", phase: "P2", status: "open", date: "" },
      { title: "Public restaurant + tastemaker pages (real data)", phase: "P2", status: "open", date: "" },
      { title: "User access tiers — free vs registered", phase: "P2", status: "open", date: "" },
      { title: "User auth + admin panel live", phase: "P2", status: "done", date: "2026-06" },
      { title: "Privacy policy + GA4/AdSense consent", phase: "P2", status: "done", date: "2026-06" },
      { title: "Review submission form (/review)", phase: "P3", status: "open", date: "" },
      { title: "Place AdSense ad units (post-approval)", phase: "P3", status: "open", date: "" },
    ],
  },
  {
    platform: "marketing",
    label: "Marketing Site",
    milestones: [
      { title: "Verify Railway deployment (was returning 502)", phase: "P1", status: "open", date: "", detail: "Last checked 2026-05-11 — was 502. Need to confirm www.tastemakersapp.com is live." },
      { title: "Content build-out for AdSense review", phase: "P2", status: "open", date: "", detail: "Thin one-page email capture site won't pass AdSense review — needs guides, city pages, editorial content" },
      { title: "Consolidate into Next.js (kill separate repo)", phase: "P3", status: "open", date: "" },
    ],
  },
];

const PLATFORM_COLORS: Record<Platform, string> = {
  backend: "var(--tm-muted)",
  ios: "var(--tm-accent)",
  android: "#facc15",
  web: "var(--tm-accent)",
  marketing: "#a78bfa",
};

function phaseColor(phase: Phase) {
  if (phase === "P1") return "var(--tm-err)";
  if (phase === "P2") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

function statusColor(s: Status) {
  if (s === "done") return "var(--tm-accent)";
  if (s === "in_progress") return "var(--tm-warn)";
  return "var(--tm-muted)";
}

export default function RoadmapPage() {
  const [openPlatforms, setOpenPlatforms] = useState<Set<Platform>>(
    new Set(["backend", "ios", "android", "web", "marketing"]),
  );
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());

  function togglePlatform(p: Platform) {
    setOpenPlatforms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  function toggleDetail(key: string) {
    setExpandedDetails((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const { open: totalOpen, done: totalDone, p1Open: totalP1 } = summarizeRoadmap(PLATFORM_ROADMAP);

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
          { label: "todo.md", active: false, href: "/admin/todo" },
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

        {/* Summary row */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 18,
            padding: "10px 14px",
            background: "var(--tm-panel)",
            border: "1px solid var(--tm-line)",
            borderRadius: 6,
            fontSize: 11.5,
          }}
        >
          <span>
            <span style={{ color: "var(--tm-err)", fontWeight: 600 }}>{totalP1}</span>
            <span style={{ color: "var(--tm-muted)" }}> P1 critical</span>
          </span>
          <span>
            <span style={{ color: "var(--tm-warn)", fontWeight: 600 }}>{totalOpen - totalP1}</span>
            <span style={{ color: "var(--tm-muted)" }}> open</span>
          </span>
          <span>
            <span style={{ color: "var(--tm-accent)", fontWeight: 600 }}>{totalDone}</span>
            <span style={{ color: "var(--tm-muted)" }}> done</span>
          </span>
          <span style={{ color: "var(--tm-muted)", marginLeft: "auto", fontSize: 10.5 }}>
            macro goals by platform · see{" "}
            <Link href="/admin/todo" style={{ color: "var(--tm-accent)", textDecoration: "none" }}>
              todo.md
            </Link>{" "}
            for implementation tasks
          </span>
        </div>

        {/* Platform groups */}
        {PLATFORM_ROADMAP.map((group) => {
          const isOpen = openPlatforms.has(group.platform);
          const p1Count = group.milestones.filter(
            (m) => m.phase === "P1" && m.status !== "done",
          ).length;
          const doneCount = group.milestones.filter((m) => m.status === "done").length;

          return (
            <div key={group.platform} style={{ marginBottom: 14 }}>
              {/* Platform header */}
              <button
                onClick={() => togglePlatform(group.platform)}
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
                <span
                  style={{
                    color: PLATFORM_COLORS[group.platform],
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  [{group.platform}]
                </span>
                <span>{group.label}</span>
                <span style={{ color: "var(--tm-muted)", marginLeft: 4 }}>
                  ({group.milestones.length})
                </span>
                {p1Count > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      color: "var(--tm-err)",
                      border: "1px solid var(--tm-err)",
                      borderRadius: 3,
                      padding: "1px 5px",
                    }}
                  >
                    {p1Count} P1
                  </span>
                )}
                {doneCount > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--tm-accent)" }}>
                    {doneCount}/{group.milestones.length} done
                  </span>
                )}
              </button>

              {/* Milestone items */}
              {isOpen && (
                <div
                  style={{
                    border: "1px solid var(--tm-line)",
                    borderTop: "none",
                    borderRadius: "0 0 6px 6px",
                    background: "var(--tm-panel)",
                  }}
                >
                  {group.milestones.map((m, i) => {
                    const detailKey = `${group.platform}-${i}`;
                    const showDetail = expandedDetails.has(detailKey);
                    return (
                      <div
                        key={i}
                        style={{
                          padding: "7px 14px",
                          borderBottom:
                            i === group.milestones.length - 1
                              ? "none"
                              : "1px solid var(--tm-line)",
                          fontSize: 11.5,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          {/* Status icon */}
                          <span style={{ color: statusColor(m.status), fontSize: 12, flexShrink: 0 }}>
                            {STATUS_ICON[m.status]}
                          </span>

                          <span
                            style={{
                              flex: 1,
                              color: m.status === "done" ? "var(--tm-muted)" : "var(--tm-ink)",
                              textDecoration: m.status === "done" ? "line-through" : "none",
                            }}
                          >
                            {m.title}
                          </span>

                          <span
                            style={{
                              fontSize: 10,
                              color: phaseColor(m.phase),
                              border: `1px solid ${phaseColor(m.phase)}`,
                              borderRadius: 3,
                              padding: "1px 5px",
                              flexShrink: 0,
                            }}
                          >
                            {m.phase}
                          </span>

                          {m.date && (
                            <span style={{ color: "var(--tm-muted)", fontSize: 10.5, flexShrink: 0 }}>
                              {m.date}
                            </span>
                          )}

                          {m.detail && (
                            <button
                              onClick={() => toggleDetail(detailKey)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--tm-muted)",
                                fontSize: 10.5,
                                padding: "0 4px",
                                fontFamily: "var(--font-jetbrains-mono), monospace",
                              }}
                            >
                              {showDetail ? "▴" : "▾"}
                            </button>
                          )}
                        </div>

                        {showDetail && m.detail && (
                          <div
                            style={{
                              marginTop: 6,
                              marginLeft: 22,
                              fontSize: 10.5,
                              color: "var(--tm-muted)",
                              lineHeight: 1.6,
                              padding: "6px 10px",
                              background: "var(--tm-bg)",
                              borderRadius: 4,
                              borderLeft: "2px solid var(--tm-line)",
                            }}
                          >
                            {m.detail}
                          </div>
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
