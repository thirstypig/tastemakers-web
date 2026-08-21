import { NextResponse, type NextRequest } from "next/server";
import { parseAllowedEmails } from "@/lib/auth";
import { adminGateDecision } from "@/lib/admin-gate";
import { updateSession } from "@/lib/supabase/middleware";
import { sanitizeShimHeaders } from "@/lib/shim-headers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The legacy iOS shim (/v2/api/* -> Laravel, see next.config.ts) carries
  // native API traffic that has no browser session and never will. Everything
  // below this block is browser-session machinery, and running it on that path
  // actively does harm:
  //
  //   - the inbound Cookie header, including the Supabase sb-* access and
  //     refresh tokens, is forwarded verbatim to api.tastemakersapp.com.
  //     @supabase/ssr sets host-only cookies, so before the shim existed those
  //     tokens could not reach that host at all.
  //   - getUser() rotates the refresh token and writes Set-Cookie onto a
  //     response that an external rewrite discards. The old token is spent and
  //     the replacement never arrives, silently signing the user out.
  //
  // Forcing Accept fixes a third problem on the way past: the shipped iOS
  // client sets Content-Type but never Accept, so Laravel's expectsJson() is
  // false and an expired token returns 302 -> http://api.tastemakersapp.com/...
  // The project has no NSAppTransportSecurity exception, so ATS blocks that
  // plaintext hop and the app cannot tell "session expired" from "network
  // down". With Accept set, Laravel returns a 401 the app can handle — no App
  // Store release required.
  //
  // The identity-header strip is defensive: Next preserves a client-supplied
  // value rather than overwriting it, so once TrustProxies is configured on the
  // Laravel side (root todo 123) a spoofed header would key the auth throttles
  // and poison password-reset link generation.
  //
  // That strip used to name x-forwarded-for and x-forwarded-host inline here,
  // and MISSED x-real-ip — which is the header Railway's edge actually sets for
  // the client address, per their published request spec. The full class now
  // lives in sanitizeShimHeaders with the reasoning and a test per header.
  if (pathname === "/v2/api" || pathname.startsWith("/v2/api/")) {
    return NextResponse.next({
      request: { headers: sanitizeShimHeaders(request.headers) },
    });
  }

  // Refresh the Supabase session on every request and read the current user.
  const { response, user } = await updateSession(request);

  const configured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

  // Admin: allowlist-gated, and it FAILS CLOSED.
  //
  // This used to read `if (configured && pathname.startsWith("/admin") ...)`,
  // so a missing SUPABASE_URL or SUPABASE_ANON_KEY skipped the gate entirely and
  // served /admin to anyone. The intent was convenience in local dev; the effect
  // was that the admin panel unlocked on a typo'd variable name, silently,
  // because nothing errors when a gate simply does not run.
  //
  // adminGateDecision now denies when identity is unknowable. Local admin work
  // needs those two variables set — a smaller cost than the alternative.
  const adminDecision = adminGateDecision({
    pathname,
    configured,
    userEmail: user?.email,
    allowedEmails: parseAllowedEmails(process.env.ADMIN_EMAILS ?? ""),
  });

  if (adminDecision === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // End-user protected areas: any authenticated user. Redirect to login with a
  // ?next so they return here after signing in. (/review is intentionally NOT
  // gated here — it shows an inline prompt instead.)
  if (configured && pathname.startsWith("/profile") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|ads.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
