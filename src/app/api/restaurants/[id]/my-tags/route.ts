import { NextResponse } from "next/server";
import { resolveAppUserId } from "@/lib/app-user";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function db() {
  return createClient(
    supabaseUrl()!,
    supabaseServiceRoleKey() ?? supabaseAnonKey()!,
    { auth: { persistSession: false } },
  );
}

/**
 * The acting user's id in public.users, derived from the verified session email.
 *
 * NOT from user_metadata.app_user_id — that field is writable by the user it
 * describes, so it was a claim rather than an identity (TODO-092).
 */
async function currentAppUserId(user: { email?: string | null }): Promise<number | null> {
  return resolveAppUserId(user, async (email) => {
    const { data } = await db().from("users").select("id").eq("email", email).maybeSingle();
    return (data?.id as number | undefined) ?? null;
  });
}

// GET /api/restaurants/[id]/my-tags
// Returns tag_ids the current user has voted for on this restaurant
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl()!,
    supabaseAnonKey()!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ tag_ids: [] });

  const appUserId = await currentAppUserId(user);
  if (!appUserId) return NextResponse.json({ tag_ids: [] });

  const { id } = await params;
  const restaurantId = parseInt(id, 10);
  if (isNaN(restaurantId)) return NextResponse.json({ tag_ids: [] });

  const db = createClient(
    supabaseUrl()!,
    supabaseServiceRoleKey() ?? supabaseAnonKey()!,
    { auth: { persistSession: false } },
  );

  const { data } = await db
    .from("restaurant_tag")
    .select("tag_id")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", appUserId);

  return NextResponse.json({ tag_ids: (data ?? []).map((r) => r.tag_id) });
}
import { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey } from "@/lib/supabase/server-env";
