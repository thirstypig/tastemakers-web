"use client";

import { useState, type FormEvent } from "react";

const t = {
  bg: "#0f0f23",
  surface: "#16162a",
  border: "#2a2a4a",
  text: "#e2e8f0",
  muted: "#94a3b8",
  dim: "#64748b",
  accent: "#60a5fa",
  red: "#f87171",
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"SF Mono", "Fira Code", "JetBrains Mono", Menlo, monospace',
};

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Login failed (${res.status})`);
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/admin";
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: t.bg,
    color: t.text,
    fontSize: 14,
    fontFamily: t.font,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 20,
        fontFamily: t.font,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: t.surface,
          borderRadius: 12,
          border: `1px solid ${t.border}`,
          padding: "40px 32px",
        }}
      >
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 700,
            color: t.text,
            textAlign: "center",
          }}
        >
          Admin Login
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: 13,
            color: t.dim,
            textAlign: "center",
          }}
        >
          Tastemakers Admin Panel
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: 12,
                color: t.muted,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tastemakersapp.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: 12,
                color: t.muted,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                background: `${t.red}15`,
                border: `1px solid ${t.red}40`,
                color: t.red,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 20px",
              borderRadius: 6,
              border: "none",
              background: t.accent,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: t.font,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: `1px solid ${t.border}`,
            textAlign: "center",
            fontSize: 12,
            color: t.dim,
          }}
        >
          <a
            href="/tech"
            style={{ color: t.accent, textDecoration: "none" }}
          >
            Under the Hood
          </a>
          <span style={{ margin: "0 8px" }}>&middot;</span>
          <a href="/" style={{ color: t.accent, textDecoration: "none" }}>
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
