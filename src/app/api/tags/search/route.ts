import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// GET /api/tags/search?q=sushi
// Typeahead for the tag review input — returns up to 8 matching tag names
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ tags: [] });

  const sb = createServerClient();
  const { data } = await sb
    .from("tags")
    .select("id, name")
    .ilike("name", `%${q}%`)
    .is("deleted_at", null)
    .order("name")
    .limit(8);

  return NextResponse.json({ tags: data ?? [] });
}
