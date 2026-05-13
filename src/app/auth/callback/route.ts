import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

async function syncPublicUser(
  supabaseAuthUrl: string,
  supabaseAnonKey: string,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<void> {
  const supabaseAuth = createServerClient(supabaseAuthUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user?.email) return;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = serviceKey
    ? createClient(supabaseAuthUrl, serviceKey, {
        auth: { persistSession: false },
      })
    : createClient(supabaseAuthUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

  const email = user.email;
  const firstName =
    user.user_metadata?.first_name ??
    user.user_metadata?.given_name ??
    email.split("@")[0];
  const lastName =
    user.user_metadata?.last_name ?? user.user_metadata?.family_name ?? "";
  const username =
    user.user_metadata?.username ??
    email.split("@")[0].replace(/[^a-z0-9_]/gi, "").slice(0, 30);

  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let appUserId: number;

  if (existing) {
    appUserId = existing.id as number;
  } else {
    const { data: inserted, error: insertError } = await db
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        username,
        role_id: 2,
        user_type: "normal",
        login_count: 1,
        last_login: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("OAuth sync-user insert error:", insertError);
      return;
    }

    appUserId = inserted.id as number;
  }

  await supabaseAuth.auth.updateUser({
    data: { app_user_id: appUserId },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/restaurants";

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sync public.users record (non-blocking — don't fail redirect if sync fails)
      try {
        await syncPublicUser(supabaseUrl, supabaseAnonKey, cookieStore);
      } catch (syncErr) {
        console.error("sync-user error in callback:", syncErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // On failure, route admin logins back to admin/login, others to /login
  const errorRedirect = next.startsWith("/admin")
    ? `${origin}/admin/login?error=auth_failed`
    : `${origin}/login?error=auth_failed`;

  return NextResponse.redirect(errorRedirect);
}
