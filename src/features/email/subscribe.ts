/**
 * beehiiv subscribe — request shaping and response mapping.
 *
 * Pure functions, separated from the route handler so the validation and the
 * error mapping can be tested without a network call or a live API key.
 */

export const BEEHIIV_API_BASE = "https://api.beehiiv.com/v2";

/** Deliberately permissive: reject the obviously broken, let beehiiv judge the rest. */
export function isPlausibleEmail(input: string): boolean {
  const email = input.trim();
  if (email.length < 3 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  const at = email.indexOf("@");
  if (at < 1 || at !== email.lastIndexOf("@")) return false;
  const domain = email.slice(at + 1);
  return domain.includes(".") && !domain.startsWith(".") && !domain.endsWith(".");
}

export function subscribeUrl(publicationId: string): string {
  return `${BEEHIIV_API_BASE}/publications/${publicationId}/subscriptions`;
}

export function subscribeBody(email: string, source: string) {
  return {
    email: email.trim(),
    // The reader asked for this, so a welcome email is expected rather than spam.
    send_welcome_email: true,
    // Never silently resurrect someone who deliberately unsubscribed.
    reactivate_existing: false,
    utm_source: source,
    utm_medium: "web",
  };
}

export type SubscribeOutcome =
  | { ok: true; status: "subscribed" | "already" }
  | { ok: false; code: "invalid" | "config" | "rate_limited" | "upstream"; message: string };

/**
 * Map a beehiiv response to something the UI can act on.
 *
 * Verified against the live API: beehiiv answers 201 for a new subscription
 * AND for a repeat of an address already on the list — it de-duplicates server
 * side rather than signalling the duplicate, so one record results either way.
 * The 200 branch is kept because the docs describe it, but in practice a
 * re-submit lands on 201; both are success from the reader's point of view.
 *
 * New subscriptions land in `validating` (double opt-in), not `active`.
 */
export function mapSubscribeResponse(status: number, body: unknown): SubscribeOutcome {
  if (status === 201) return { ok: true, status: "subscribed" };
  if (status === 200) return { ok: true, status: "already" };

  if (status === 400) {
    return { ok: false, code: "invalid", message: "That email address didn't look right." };
  }
  if (status === 401 || status === 403) {
    // A key problem is ours, not the reader's — never show them the detail.
    return { ok: false, code: "config", message: "Sign-up is temporarily unavailable." };
  }
  if (status === 429) {
    return { ok: false, code: "rate_limited", message: "Too many attempts. Try again shortly." };
  }

  const detail =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message)
      : "";
  return {
    ok: false,
    code: "upstream",
    message: detail || "Could not sign you up just now.",
  };
}
