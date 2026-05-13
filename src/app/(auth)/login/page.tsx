"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { validateEmail, validatePassword } from "@/lib/validation";

const styles = {
  page: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
  } as React.CSSProperties,
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#2A1A60",
    border: "1px solid #3D2E6E",
    borderRadius: 12,
    padding: "40px 36px",
  } as React.CSSProperties,
  heading: {
    color: "#fff",
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
    letterSpacing: "-0.02em",
  } as React.CSSProperties,
  subheading: {
    color: "#8b81a3",
    fontSize: 14,
    marginBottom: 28,
  } as React.CSSProperties,
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0",
  } as React.CSSProperties,
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#3D2E6E",
  } as React.CSSProperties,
  dividerText: {
    color: "#8b81a3",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },
  label: {
    display: "block",
    color: "#B7ADCF",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: "100%",
    background: "#1A1038",
    border: "1px solid #3D2E6E",
    borderRadius: 6,
    color: "#fff",
    fontSize: 14,
    padding: "10px 14px",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s ease",
  } as React.CSSProperties,
  inputError: {
    borderColor: "#DB1657",
  } as React.CSSProperties,
  fieldError: {
    color: "#DB1657",
    fontSize: 12,
    marginTop: 4,
  } as React.CSSProperties,
  fieldGroup: {
    marginBottom: 16,
  } as React.CSSProperties,
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "#DB1657",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    padding: "12px 0",
    cursor: "pointer",
    letterSpacing: "0.01em",
    transition: "background 0.15s ease",
  } as React.CSSProperties,
  submitBtn: {
    width: "100%",
    background: "#3D2E6E",
    border: "1px solid #594094",
    borderRadius: 6,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    padding: "12px 0",
    cursor: "pointer",
    letterSpacing: "0.01em",
    transition: "background 0.15s ease, border-color 0.15s ease",
    marginTop: 4,
  } as React.CSSProperties,
  globalError: {
    background: "rgba(219, 22, 87, 0.12)",
    border: "1px solid rgba(219, 22, 87, 0.4)",
    borderRadius: 6,
    color: "#DB1657",
    fontSize: 13,
    padding: "10px 14px",
    marginBottom: 16,
  } as React.CSSProperties,
  footer: {
    marginTop: 24,
    textAlign: "center" as const,
    color: "#8b81a3",
    fontSize: 13,
  } as React.CSSProperties,
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Show auth_failed param error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth_failed") {
      setGlobalError("Sign in failed. Please try again.");
    }
  }, []);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setGlobalError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin + "/auth/callback?next=/restaurants",
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

    router.push("/restaurants");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.subheading}>Sign in to your Tastemakers account</p>

        {globalError && <div style={styles.globalError}>{globalError}</div>}

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            ...styles.googleBtn,
            opacity: googleLoading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!googleLoading)
              (e.currentTarget as HTMLButtonElement).style.background = "#b8134a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#DB1657";
          }}
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Email + password form */}
        <form onSubmit={handleEmailSignIn} noValidate>
          <div style={styles.fieldGroup}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              style={{
                ...styles.input,
                ...(emailError ? styles.inputError : {}),
              }}
              placeholder="you@example.com"
            />
            {emailError && <p style={styles.fieldError}>{emailError}</p>}
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              style={{
                ...styles.input,
                ...(passwordError ? styles.inputError : {}),
              }}
              placeholder="••••••••"
            />
            {passwordError && <p style={styles.fieldError}>{passwordError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.background = "#594094";
                btn.style.borderColor = "#876DC4";
              }
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = "#3D2E6E";
              btn.style.borderColor = "#594094";
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          No account?{" "}
          <Link
            href="/signup"
            style={{ color: "#DB1657", textDecoration: "none", fontWeight: 600 }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="rgba(255,255,255,0.85)"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="rgba(255,255,255,0.7)"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="rgba(255,255,255,0.55)"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
