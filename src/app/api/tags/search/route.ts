import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { sanitizeSearchTerm, likePattern } from "@/features/search/query";

// GET /api/tags/search?q=sushi
// Typeahead for the tag review input — returns up to 8 matching tag names
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("q") ?? "";

  // Sanitise before building the pattern. This used to interpolate the raw query
  // as `%${q}%`, so `%` and `_` from the user acted as wildcards and the filter
  // widened itself — a search for `%` matched every tag.
  //
  // Not injection (supabase-js parameterises), but the filter stopped meaning
  // what the person typed. `features/search` already ran every term through
  // these two helpers; this route simply never called them.
  const term = sanitizeSearchTerm(raw);
  if (!term) return NextResponse.json({ tags: [] });

  const sb = createServerClient();
  const { data } = await sb
    .from("tags")
    .select("id, name")
    .ilike("name", likePattern(term))
    .is("deleted_at", null)
    .order("name")
    .limit(8);

  return NextResponse.json({ tags: data ?? [] });
}
