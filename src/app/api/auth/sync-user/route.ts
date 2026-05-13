import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();

  // Verify session from cookies
  const supabaseAuth = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
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
    },
  );

  const {
    data: { user },
    error: sessionError,
  } = await supabaseAuth.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use service role key for writing to public.users if available;
  // fall back to anon key with persistSession: false
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const db = serviceKey
    ? createClient(process.env.SUPABASE_URL!, serviceKey, {
        auth: { persistSession: false },
      })
    : createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
      });

  const email = user.email!;
  const firstName =
    user.user_metadata?.first_name ??
    user.user_metadata?.given_name ??
    email.split("@")[0];
  const lastName =
    user.user_metadata?.last_name ?? user.user_metadata?.family_name ?? "";
  const username =
    user.user_metadata?.username ??
    email.split("@")[0].replace(/[^a-z0-9_]/gi, "").slice(0, 30);

  // Check if user already exists in public.users
  const { data: existing } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  let appUserId: number;

  if (existing) {
    appUserId = existing.id as number;
  } else {
    // Insert new public user record
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
      console.error("sync-user insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create user record" },
        { status: 500 },
      );
    }

    appUserId = inserted.id as number;
  }

  // Store app_user_id in Supabase user metadata
  await supabaseAuth.auth.updateUser({
    data: { app_user_id: appUserId },
  });

  return NextResponse.json({ app_user_id: appUserId });
}
