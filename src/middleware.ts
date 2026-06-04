import { NextResponse, type NextRequest } from "next/server";
import { parseAllowedEmails, isEmailAllowed } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
