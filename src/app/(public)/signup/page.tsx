"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { validateEmail, validatePassword, validateRequired } from "@/lib/validation";

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
    maxWidth: 460,
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
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 16,
  } as React.CSSProperties,
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
  successMsg: {
    background: "rgba(89, 64, 148, 0.3)",
    border: "1px solid #594094",
    borderRadius: 6,
    color: "#B7ADCF",
    fontSize: 13,
    padding: "10px 14px",
    marginBottom: 16,
  } as React.CSSProperties,
  hint: {
    color: "#8b81a3",
    fontSize: 12,
    marginTop: 4,
  } as React.CSSProperties,
  footer: {
    marginTop: 24,
    textAlign: "center" as const,
    color: "#8b81a3",
    fontSize: 13,
  } as React.CSSProperties,
};

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function validate(): FormErrors {
    const e: FormErrors = {};
    const fnErr = validateRequired(firstName, "First name");
    if (fnErr) e.firstName = fnErr;
    const lnErr = validateRequired(lastName, "Last name");
    if (lnErr) e.lastName = lnErr;
    const uErr = validateRequired(username, "Username");
    if (uErr) {
      e.username = uErr;
    } else if (username.length > 30) {
      e.username = "Username must be 30 characters or fewer";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      e.username = "Username may only contain letters, numbers, and underscores";
    }
    const emErr = validateEmail(email);
    if (emErr) e.email = emErr;
    const pwErr = validatePassword(password);
    if (pwErr) e.password = pwErr;
    return e;
  }

  async function handleGoogleSignUp() {
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          username,
        },
      },
    });

    if (error) {
      setLoading(false);
      setGlobalError(error.message);
      return;
    }

    // If email confirmation is required, show a success message
    if (data.user && !data.session) {
      setLoading(false);
      setSuccess(true);
      return;
    }

    // Session is available — sync public.users record
    if (data.session) {
      try {
        await fetch("/api/auth/sync-user", { method: "POST" });
      } catch (syncErr) {
        console.error("sync-user error:", syncErr);
      }
    }

    setLoading(false);
    router.push("/restaurants");
  }

  function clearFieldError(field: keyof FormErrors) {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Check your email</h1>
          <p style={styles.subheading}>
            We sent a confirmation link to <strong style={{ color: "#fff" }}>{email}</strong>.
            Click the link to activate your account.
          </p>
          <p style={{ ...styles.hint, marginTop: 16 }}>
            Already confirmed?{" "}
            <Link href="/login" style={{ color: "#DB1657", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Create account</h1>
        <p style={styles.subheading}>Join Tastemakers and start discovering</p>

        {globalError && <div style={styles.globalError}>{globalError}</div>}

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignUp}
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
          {googleLoading ? "Redirecting…" : "Sign up with Google"}
        </button>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* First / Last name row */}
          <div style={styles.row}>
            <div>
              <label htmlFor="firstName" style={styles.label}>
                First name
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearFieldError("firstName");
                }}
                style={{
                  ...styles.input,
                  ...(errors.firstName ? styles.inputError : {}),
                }}
                placeholder="Jane"
              />
              {errors.firstName && (
                <p style={styles.fieldError}>{errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" style={styles.label}>
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearFieldError("lastName");
                }}
                style={{
                  ...styles.input,
                  ...(errors.lastName ? styles.inputError : {}),
                }}
                placeholder="Smith"
              />
              {errors.lastName && (
                <p style={styles.fieldError}>{errors.lastName}</p>
              )}
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="username" style={styles.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              maxLength={30}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError("username");
              }}
              style={{
                ...styles.input,
                ...(errors.username ? styles.inputError : {}),
              }}
              placeholder="janesmith"
            />
            {errors.username ? (
              <p style={styles.fieldError}>{errors.username}</p>
            ) : (
              <p style={styles.hint}>
                Letters, numbers, underscores — max 30 chars
              </p>
            )}
          </div>

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
                clearFieldError("email");
              }}
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {}),
              }}
              placeholder="you@example.com"
            />
            {errors.email && <p style={styles.fieldError}>{errors.email}</p>}
          </div>

          <div style={styles.fieldGroup}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              style={{
                ...styles.input,
                ...(errors.password ? styles.inputError : {}),
              }}
              placeholder="At least 8 characters"
            />
            {errors.password && (
              <p style={styles.fieldError}>{errors.password}</p>
            )}
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "#DB1657", textDecoration: "none", fontWeight: 600 }}
          >
            Sign in
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
