import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { levelFor } from "@/features/tags/levels";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid restaurant ID" }, { status: 400 });
  }

  const sb = createServerClient();

  const { data: tagRows } = await sb
    .from("restaurant_tag")
    .select("tag_id")
    .eq("restaurant_id", numId);

  if (!tagRows?.length) {
    return NextResponse.json({ tags: [] });
  }

  // Aggregate votes: one row per user per tag → count duplicates
  const voteMap = new Map<number, number>();
  for (const r of tagRows) {
    voteMap.set(r.tag_id, (voteMap.get(r.tag_id) ?? 0) + 1);
  }

  const tagIds = [...voteMap.keys()];
  const { data: tagData } = await sb
    .from("tags")
    .select("id, name")
    .in("id", tagIds)
    .is("deleted_at", null);

  const tagById = new Map((tagData ?? []).map((t) => [t.id, t.name]));

  // Level relative to this restaurant's leading tag, matching iOS.
  const ranked = [...voteMap.entries()].sort((a, b) => b[1] - a[1]);
  const highest = ranked.length > 0 ? ranked[0]![1] : 0;

  const tags = ranked.flatMap(([tagId, count]) => {
    const name = tagById.get(tagId);
    if (!name) return [];
    return [{ id: String(tagId), name, level: levelFor(count, highest), count }];
  });

  return NextResponse.json({ tags });
}
