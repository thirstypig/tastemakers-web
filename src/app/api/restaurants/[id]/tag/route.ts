import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

async function getSessionUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function db() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

// POST /api/restaurants/[id]/tag — add a vote (or create + vote a new tag)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUserId = user.user_metadata?.app_user_id as number | undefined;
  if (!appUserId) return NextResponse.json({ error: "User not synced" }, { status: 403 });

  const { id } = await params;
  const restaurantId = parseInt(id, 10);
  if (isNaN(restaurantId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json() as { tag_id?: number; tag_name?: string };

  let tagId = body.tag_id;

  // If a new tag name was provided, find or create it
  if (!tagId && body.tag_name) {
    const name = body.tag_name.trim().slice(0, 17);
    if (!name) return NextResponse.json({ error: "Empty tag" }, { status: 400 });

    const { data: existing } = await db()
      .from("tags")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (existing) {
      tagId = existing.id as number;
    } else {
      const { data: created, error } = await db()
        .from("tags")
        .insert({ name })
        .select("id")
        .single();
      if (error || !created) return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
      tagId = created.id as number;
    }
  }

  if (!tagId) return NextResponse.json({ error: "tag_id or tag_name required" }, { status: 400 });

  // Upsert — ignore if user already voted for this tag on this restaurant
  const { error } = await db()
    .from("restaurant_tag")
    .insert({ restaurant_id: restaurantId, tag_id: tagId, user_id: appUserId })
    .select();

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tag_id: tagId });
}

// DELETE /api/restaurants/[id]/tag — remove the current user's vote
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUserId = user.user_metadata?.app_user_id as number | undefined;
  if (!appUserId) return NextResponse.json({ error: "User not synced" }, { status: 403 });

  const { id } = await params;
  const restaurantId = parseInt(id, 10);
  if (isNaN(restaurantId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json() as { tag_id: number };
  if (!body.tag_id) return NextResponse.json({ error: "tag_id required" }, { status: 400 });

  await db()
    .from("restaurant_tag")
    .delete()
    .eq("restaurant_id", restaurantId)
    .eq("tag_id", body.tag_id)
    .eq("user_id", appUserId);

  return NextResponse.json({ ok: true });
}
