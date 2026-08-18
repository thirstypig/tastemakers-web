import { NextResponse, type NextRequest } from "next/server";
import { parseAllowedEmails, isEmailAllowed } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

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
  // The x-forwarded-* strip is defensive: Next preserves a client-supplied
  // value rather than overwriting it, so once TrustProxies is configured on the
  // Laravel side (todo 112) a spoofed header would key the auth throttles and
  // poison password-reset link generation.
  if (pathname === "/v2/api" || pathname.startsWith("/v2/api/")) {
    const headers = new Headers(request.headers);
    headers.delete("cookie");
    headers.set("accept", "application/json");
    headers.delete("x-forwarded-for");
    headers.delete("x-forwarded-host");
    return NextResponse.next({ request: { headers } });
  }

  // Refresh the Supabase session on every request and read the current user.
  const { response, user } = await updateSession(request);

  // If Supabase isn't configured (e.g. local dev), don't gate anything.
  const configured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;

  // Admin: allowlist-gated (the login page itself stays open).
  if (configured && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const allowedEmails = parseAllowedEmails(process.env.ADMIN_EMAILS ?? "");
    if (!user || !isEmailAllowed(user.email, allowedEmails)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
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
