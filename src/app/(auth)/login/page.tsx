"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { validateEmail, validatePassword } from "@/lib/validation";
import { safeRedirectPath } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  // Show auth_failed param error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth_failed") {
      setGlobalError("Sign in failed. Please try again.");
    }
  }, []);

  // Post-login destination: ?next=… if it's a safe same-origin relative path,
  // else the default. Open-redirect protection lives in safeRedirectPath (tested).
  function safeNext(): string {
    return safeRedirectPath(new URLSearchParams(window.location.search).get("next"));
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setGlobalError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin +
          "/auth/callback?next=" +
          encodeURIComponent(safeNext()),
      },
    });
    if (error) {
      setGlobalError(error.message);
      setGoogleLoading(false);
    }
    // On success, browser redirects — no need to setGoogleLoading(false)
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setNotice(null);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setGlobalError(error.message);
      return;
    }

    router.push(safeNext());
  }

  // Magic link — same address field, no password required.
  async function handleMagicLink() {
    setGlobalError(null);
    setNotice(null);

    const eErr = validateEmail(email);
    setEmailError(eErr);
    if (eErr) return;

    setMagicLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          window.location.origin +
          "/auth/callback?next=" +
          encodeURIComponent(safeNext()),
      },
    });
    setMagicLoading(false);

    if (error) {
      setGlobalError(error.message);
      return;
    }
    setNotice(`Check ${email} for a sign-in link.`);
  }

  return (
    <div className="tm-auth-formInner">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="tm-auth-title">Welcome back</h1>
        <p className="tm-auth-sub">Sign in to tag, heart photos, and bookmark places.</p>
      </div>

      {globalError ? (
        <p className="tm-auth-error" role="alert">
          {globalError}
        </p>
      ) : null}
      {notice ? (
        <p className="tm-auth-note" role="status">
          {notice}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="tm-auth-google"
      >
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </button>

      <div className="tm-auth-divider">or</div>

      <form onSubmit={handleEmailSignIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="tm-auth-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="tm-auth-input"
            type="email"
            autoComplete="email"
            value={email}
            aria-invalid={Boolean(emailError)}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(null);
            }}
          />
          {emailError ? <p className="tm-auth-fielderr">{emailError}</p> : null}
        </div>

        <div>
          <label className="tm-auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="tm-auth-input"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={Boolean(passwordError)}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
          />
          {passwordError ? <p className="tm-auth-fielderr">{passwordError}</p> : null}
        </div>

        <button type="submit" className="tm-btn tm-btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <button type="button" className="tm-auth-alt" onClick={handleMagicLink} disabled={magicLoading}>
        {magicLoading ? "Sending…" : "Email me a sign-in link instead"}
      </button>

      <p className="tm-auth-foot">
        No account?{" "}
        <Link href="/signup" className="tm-link">
          Create one
        </Link>
      </p>
    </div>
  );
}
