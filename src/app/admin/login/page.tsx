"use client";

import { useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = !!(SUPABASE_URL && SUPABASE_ANON);

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
      });
      if (error) setError(error.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{
        background: "var(--tm-bg)",
        fontFamily: "var(--font-jetbrains-mono), monospace",
      }}
    >
      <div
        className="w-full max-w-[360px] mx-4 rounded-md overflow-hidden"
        style={{
          background: "var(--tm-panel)",
          border: "1px solid var(--tm-line)",
        }}
      >
        {/* Faux traffic lights */}
        <div
          className="flex gap-[5px] px-3 py-2"
          style={{ borderBottom: "1px solid var(--tm-line)" }}
        >
          {["#ff5f56", "#ffbd2e", "#27c93f"].map((c) => (
            <span
              key={c}
              className="rounded-full"
              style={{ width: 11, height: 11, background: c, display: "block" }}
            />
          ))}
        </div>

        {/* Card body */}
        <div className="px-8 py-8">
          <p
            className="text-[11px] mb-3"
            style={{ color: "var(--tm-muted)" }}
          >
            # tastemakers / admin
          </p>
          <h1
            className="text-[16px] font-semibold mb-6"
            style={{ color: "var(--tm-ink)" }}
          >
            sign in
          </h1>

          {!configured ? (
            <div
              className="text-[11px] rounded px-3 py-3"
              style={{
                background: "var(--tm-accent-bg)",
                border: "1px solid var(--tm-line)",
                color: "var(--tm-ink)",
              }}
            >
              <p className="font-semibold mb-2" style={{ color: "var(--tm-accent)" }}>
                Supabase not configured
              </p>
              <p style={{ color: "var(--tm-muted)" }}>
                Set these env vars in <code>.env.local</code>:
              </p>
              <pre
                className="mt-2 text-[10px]"
                style={{ color: "var(--tm-ink)" }}
              >
                {`NEXT_PUBLIC_SUPABASE_URL=\nhttps://zdeyrwzztsyezfxxtdcs.supabase.co\n\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\n<anon key from Supabase dashboard>`}
              </pre>
              <p className="mt-3" style={{ color: "var(--tm-muted)" }}>
                Also enable Google OAuth in Supabase → Auth → Providers.
              </p>
              {/* The "continue without auth (dev)" link that used to sit here is
                  gone. It pointed at /admin, and back when the gate was wrapped
                  in `if (configured && ...)` an unset Supabase variable skipped
                  the check entirely — so on a misconfigured PRODUCTION deploy
                  this rendered a working "walk in" button on a public page.

                  `adminGateDecision` now denies when identity is unknowable, so
                  the link stopped working. Removing it rather than leaving it
                  dead: an affordance that promises access it cannot grant is
                  either a bug report waiting to happen or an invitation to
                  "fix" the gate. Todo 097. */}
            </div>
          ) : (
            <>
              {error && (
                <div
                  className="mb-4 text-[11px] rounded px-3 py-2"
                  style={{
                    background: "var(--tm-err)18",
                    border: "1px solid var(--tm-err)40",
                    color: "var(--tm-err)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-9 rounded text-[11px] cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: "transparent",
                  border: "1px solid var(--tm-line)",
                  color: "var(--tm-ink)",
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--tm-accent-bg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {loading ? "signing in..." : "Continue with Google"}
              </button>

              <p
                className="mt-4 text-center text-[10.5px]"
                style={{ color: "var(--tm-muted)" }}
              >
                → owner accounts only
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
