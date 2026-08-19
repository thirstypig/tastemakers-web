import { isEmailAllowed } from "@/lib/auth";

export interface AdminGateInput {
  pathname: string;
  /** Whether Supabase credentials are present, i.e. whether identity is knowable at all. */
  configured: boolean;
  userEmail?: string | null;
  allowedEmails: string[];
}

/**
 * Decide whether a request may reach an `/admin` page.
 *
 * The middleware previously wrapped the whole gate in a `configured` check:
 *
 *     const configured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
 *     if (configured && pathname.startsWith("/admin") ...) { ...gate... }
 *
 * so a missing environment variable SKIPPED the gate and served /admin to
 * anyone. The intent was convenience in local dev, but the effect is that the
 * admin panel is unlocked by the absence of configuration — the one failure mode
 * nobody notices, because nothing errors.
 *
 * Unknowable identity now denies. If Supabase is not configured we cannot say who
 * the caller is, and "cannot say" must not mean "let them in". Local development
 * against admin needs SUPABASE_URL and SUPABASE_ANON_KEY set, which is a smaller
 * cost than a gate that opens on a typo'd variable name.
 *
 * An empty allowlist also denies. `isEmailAllowed` treats an empty list as
 * "everyone", which is a reasonable default for a helper and the wrong one here.
 */
export function adminGateDecision(input: AdminGateInput): "allow" | "redirect" {
  const { pathname, configured, userEmail, allowedEmails } = input;

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  if (!isAdminPath) return "allow";

  // The login page must stay reachable or there is no way to become an admin.
  if (pathname === "/admin/login") return "allow";

  if (!configured) return "redirect";
  if (!userEmail) return "redirect";
  if (allowedEmails.length === 0) return "redirect";

  return isEmailAllowed(userEmail, allowedEmails) ? "allow" : "redirect";
}
