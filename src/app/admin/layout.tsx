"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Smartphone,
  Tablet,
  Globe,
  Server,
  Map,
  FileClock,
  BookOpen,
  Route,
  AlertTriangle,
  BarChart2,
  Activity,
  Cpu,
  Sun,
  Moon,
  Menu,
  X,
  Search,
} from "lucide-react";

// ── Nav structure matching the Terminal mockup ──────────────────
const NAV_GROUPS = [
  {
    id: "overview",
    label: "overview",
    href: "/admin",
    icon: LayoutDashboard,
    children: [
      { label: "users", href: "/admin/users", icon: Users },
      { label: "errors.log", href: "/admin/errors", icon: AlertTriangle },
    ],
  },
  {
    id: "platforms",
    label: "platforms",
    href: null,
    icon: Smartphone,
    children: [
      { label: "ios", href: "/admin/platforms/ios", icon: Smartphone },
      { label: "android", href: "/admin/platforms/android", icon: Tablet },
      { label: "web", href: "/admin/platforms/web", icon: Globe },
      { label: "api", href: "/admin/platforms/api", icon: Server },
    ],
  },
  {
    id: "ops",
    label: "ops",
    href: null,
    icon: Map,
    children: [
      { label: "roadmap.md", href: "/admin/roadmap", icon: Map },
      { label: "changelog.md", href: "/admin/changelog", icon: FileClock },
      { label: "routes.json", href: "/admin/routes", icon: Route },
      { label: "docs/", href: "/admin/docs", icon: BookOpen },
      { label: "analytics", href: "/admin/analytics", icon: BarChart2 },
      { label: "status", href: "/admin/status", icon: Activity },
      { label: "tech.md", href: "/admin/tech", icon: Cpu },
    ],
  },
];

// ── Command palette actions ─────────────────────────────────────
const CMD_ITEMS = [
  { label: "Go to Overview", href: "/admin" },
  { label: "Go to Users", href: "/admin/users" },
  { label: "Go to Errors", href: "/admin/errors" },
  { label: "Go to Roadmap", href: "/admin/roadmap" },
  { label: "Go to Changelog", href: "/admin/changelog" },
  { label: "Go to Routes", href: "/admin/routes" },
  { label: "Go to Docs", href: "/admin/docs" },
  { label: "Go to Analytics", href: "/admin/analytics" },
  { label: "Go to Status", href: "/admin/status" },
  { label: "Go to Tech", href: "/admin/tech" },
  { label: "iOS Platform", href: "/admin/platforms/ios" },
  { label: "Android Platform", href: "/admin/platforms/android" },
  { label: "Web Platform", href: "/admin/platforms/web" },
  { label: "API Platform", href: "/admin/platforms/api" },
];

function getStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("tm-admin-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(["overview", "platforms", "ops"]),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");

  // Load theme on mount
  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "");
  }, []);

  // ⌘K listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
        setCmdQuery("");
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("tm-admin-theme", next);
    document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "");
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Determine active nav item
  function isActive(href: string | null) {
    if (!href) return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const filteredCmds = CMD_ITEMS.filter((c) =>
    c.label.toLowerCase().includes(cmdQuery.toLowerCase()),
  );

  return (
    <div
      className="flex flex-col h-screen overflow-hidden font-mono"
      style={{
        background: "var(--tm-bg)",
        color: "var(--tm-ink)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      {/* ── Command bar ──────────────────────────────────────── */}
      <header
        className="flex-shrink-0 flex items-center gap-3 px-3"
        style={{
          height: 34,
          background: "var(--tm-panel)",
          borderBottom: "1px solid var(--tm-line)",
        }}
      >
        {/* Traffic lights */}
        <div className="flex gap-[5px]">
          {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
            <span
              key={c}
              className="rounded-full flex-shrink-0"
              style={{ width: 11, height: 11, background: c }}
            />
          ))}
        </div>

        {/* Path */}
        <span className="text-[11px]" style={{ color: "var(--tm-muted)" }}>
          ~/tastemakers/admin
        </span>

        <div className="flex-1" />

        {/* Command input */}
        <button
          onClick={() => { setCmdOpen(true); setCmdQuery(""); }}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] cursor-pointer"
          style={{
            background: "var(--tm-bg)",
            border: "1px solid var(--tm-line)",
            color: "var(--tm-muted)",
          }}
        >
          <span style={{ color: "var(--tm-accent)" }}>▶</span>
          <span className="hidden sm:inline">type a command...</span>
          <span
            className="text-[10px] px-1 rounded ml-2"
            style={{ background: "var(--tm-line)" }}
          >
            ⌘K
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1 rounded cursor-pointer"
          style={{ color: "var(--tm-muted)" }}
          title="Toggle theme"
        >
          {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
        </button>

        {/* Mobile sidebar toggle */}
        <button
          className="sm:hidden p-1 rounded cursor-pointer"
          style={{ color: "var(--tm-muted)" }}
          onClick={() => setSidebarOpen((o) => !o)}
        >
          {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>

        {/* Avatar */}
        <div
          className="w-[22px] h-[22px] rounded flex-shrink-0 hidden sm:block"
          style={{ background: "var(--tm-line)" }}
        />
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 sm:hidden"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className="flex-shrink-0 overflow-y-auto z-30"
          style={{
            width: 180,
            background: "var(--tm-panel)",
            borderRight: "1px solid var(--tm-line)",
            fontSize: 11.5,
            // Mobile: slide in as drawer
            ...(typeof window !== "undefined" && window.innerWidth < 640
              ? {
                  position: "fixed" as const,
                  top: 34,
                  bottom: 24,
                  left: 0,
                  transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                  transition: "transform 0.2s ease",
                }
              : {}),
          }}
        >
          <div className="py-2">
            {NAV_GROUPS.map((group) => {
              const open = openGroups.has(group.id);
              const groupActive =
                group.href
                  ? isActive(group.href)
                  : group.children.some((c) => isActive(c.href));

              return (
                <div key={group.id}>
                  {/* Group header */}
                  <div
                    className="flex items-center cursor-pointer select-none"
                    style={{
                      padding: "3px 12px",
                      color: groupActive ? "var(--tm-accent)" : "var(--tm-muted)",
                      background: groupActive && group.href ? "var(--tm-accent-bg)" : "transparent",
                      fontWeight: groupActive ? 600 : 400,
                    }}
                    onClick={() => {
                      if (group.href) {
                        router.push(group.href);
                        setSidebarOpen(false);
                      } else {
                        toggleGroup(group.id);
                      }
                    }}
                  >
                    <span className="mr-1">{open ? "▾" : "▸"}</span>
                    <span>{group.label}</span>
                  </div>

                  {/* Children */}
                  {open &&
                    group.children.map((child) => {
                      const active = isActive(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          style={{
                            display: "block",
                            padding: "3px 12px",
                            paddingLeft: 24,
                            color: active ? "var(--tm-accent)" : "var(--tm-muted)",
                            background: active ? "var(--tm-accent-bg)" : "transparent",
                            fontWeight: active ? 600 : 400,
                            textDecoration: "none",
                          }}
                        >
                          · {child.label}
                        </Link>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* ── Status footer ────────────────────────────────────── */}
      <footer
        className="flex-shrink-0 flex items-center justify-between px-3"
        style={{
          height: 24,
          background: "var(--tm-panel)",
          borderTop: "1px solid var(--tm-line)",
          fontSize: 10.5,
          color: "var(--tm-muted)",
        }}
      >
        <div className="flex gap-3">
          <span>
            <span className="tm-pulse" style={{ color: "var(--tm-accent)" }}>
              ●
            </span>{" "}
            api.tastemakersapp.com
          </span>
          <span className="hidden sm:inline">railway · prod</span>
          <span className="hidden md:inline">pg:5446</span>
          <span className="hidden md:inline">redis:6384</span>
        </div>
        <div className="flex gap-3">
          <span className="hidden sm:inline">tests 1/9</span>
          <span className="hidden sm:inline">p95 142ms</span>
          <span style={{ color: "var(--tm-err)" }}>err 0.34%</span>
        </div>
      </footer>

      {/* ── ⌘K Command palette ───────────────────────────────── */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-[480px] mx-4 rounded-md overflow-hidden"
            style={{
              background: "var(--tm-panel)",
              border: "1px solid var(--tm-line)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ borderBottom: "1px solid var(--tm-line)" }}
            >
              <Search size={13} style={{ color: "var(--tm-muted)" }} />
              <input
                autoFocus
                className="flex-1 bg-transparent outline-none text-[11px]"
                style={{ color: "var(--tm-ink)" }}
                placeholder="type a command..."
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredCmds[0]) {
                    router.push(filteredCmds[0].href);
                    setCmdOpen(false);
                  }
                }}
              />
              <span
                className="text-[10px] px-1 rounded"
                style={{
                  background: "var(--tm-line)",
                  color: "var(--tm-muted)",
                }}
              >
                esc
              </span>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto py-1">
              {filteredCmds.length === 0 ? (
                <div
                  className="px-3 py-3 text-[11px]"
                  style={{ color: "var(--tm-muted)" }}
                >
                  no results
                </div>
              ) : (
                filteredCmds.map((item) => (
                  <button
                    key={item.href}
                    className="w-full text-left px-3 py-2 text-[11px] cursor-pointer block"
                    style={{ color: "var(--tm-ink)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--tm-accent-bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => {
                      router.push(item.href);
                      setCmdOpen(false);
                    }}
                  >
                    <span style={{ color: "var(--tm-accent)" }}>→</span>{" "}
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
