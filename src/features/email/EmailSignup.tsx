"use client";

import { useState } from "react";
import "./email.css";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; already: boolean }
  | { kind: "error"; message: string };

/**
 * beehiiv signup. Posts to /api/subscribe, which holds the key server-side.
 *
 * Success and "you were already on the list" are both treated as success —
 * telling someone their existing subscription is an error helps nobody.
 */
export default function EmailSignup({
  source = "home-footer",
  heading = "Get the occasional email",
  body = "New lists, new cities, and what people are tagging. No more than monthly.",
}: {
  source?: string;
  heading?: string;
  body?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state.kind === "sending") return;
    setState({ kind: "sending" });

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        error?: string;
      };

      if (res.ok && payload.ok) {
        setState({ kind: "done", already: payload.status === "already" });
        setEmail("");
      } else {
        setState({ kind: "error", message: payload.error ?? "Could not sign you up." });
      }
    } catch {
      setState({ kind: "error", message: "Could not reach the server." });
    }
  }

  return (
    <section className="tm-card tm-signup">
      <div className="tm-signup-copy">
        <h2 className="tm-signup-heading">{heading}</h2>
        <p className="tm-signup-body">{body}</p>
      </div>

      {state.kind === "done" ? (
        <p className="tm-signup-done" role="status">
          {state.already ? "You're already on the list." : "You're in — check your inbox."}
        </p>
      ) : (
        <form className="tm-signup-form" onSubmit={submit}>
          <label className="tm-sr-only" htmlFor={`email-${source}`}>
            Email address
          </label>
          <input
            id={`email-${source}`}
            className="tm-signup-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            required
            aria-invalid={state.kind === "error"}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state.kind === "error") setState({ kind: "idle" });
            }}
          />
          <button
            type="submit"
            className="tm-btn tm-btn-primary"
            disabled={state.kind === "sending" || email.trim().length === 0}
          >
            {state.kind === "sending" ? "Signing up…" : "Sign up"}
          </button>
        </form>
      )}

      {state.kind === "error" ? (
        <p className="tm-signup-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
