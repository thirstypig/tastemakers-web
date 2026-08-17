"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import RankedTagChip from "./RankedTagChip";
import { assignTagLevels } from "./levels";
import "./ranked.css";

export interface CloudTag {
  id: string;
  name: string;
  count: number;
  mine?: boolean;
}

const VISIBLE_LIMIT = 12;

/**
 * The ranked "Known for" cloud: click a tag to add your vote, click again to
 * remove it, and the cloud re-levels and re-sorts live.
 *
 * Levels come from `assignTagLevels`, the port of iOS `calcucateTagLevels` —
 * each tag's distance from this restaurant's leading tag.
 *
 * Voting is optimistic with rollback, and the rollback matters: production's
 * UNIQUE (restaurant_id, tag_id) means a tag someone else already applied here
 * is refused with 409 vote_blocked (todo 067).
 */
export default function RankedTagCloud({
  restaurantId,
  tags,
}: {
  restaurantId: string;
  tags: CloudTag[];
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [local, setLocal] = useState<CloudTag[]>(tags);
  const [showAll, setShowAll] = useState(false);
  const [justVoted, setJustVoted] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const levelled = useMemo(() => assignTagLevels(local), [local]);
  const visible = showAll ? levelled : levelled.slice(0, VISIBLE_LIMIT);

  async function vote(tag: CloudTag) {
    if (!user) return;

    const before = local;
    const adding = !tag.mine;

    setLocal((list) =>
      list.map((t) =>
        t.id === tag.id
          ? { ...t, mine: adding, count: Math.max(0, t.count + (adding ? 1 : -1)) }
          : t,
      ),
    );
    setJustVoted(tag.id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustVoted(null), 420);
    setStatus(adding ? `Voted for ${tag.name}.` : `Removed your vote for ${tag.name}.`);

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/tag`, {
        method: adding ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: Number(tag.id) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setLocal(before);
        setStatus(body.error ?? `Could not save your vote for ${tag.name}.`);
      }
    } catch {
      setLocal(before);
      setStatus(`Could not save your vote for ${tag.name}.`);
    }
  }

  if (levelled.length === 0) {
    return (
      <div className="tm-card" style={{ padding: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--tm-muted)" }}>
          No tags yet — be the first to tag this place.
        </p>
      </div>
    );
  }

  return (
    <section className="tm-card tm-cloud">
      <div className="tm-cloud-head">
        <span className="tm-cloud-label">KNOWN FOR</span>
        {levelled.length > VISIBLE_LIMIT ? (
          <button type="button" className="tm-cloud-toggle" onClick={() => setShowAll((v) => !v)}>
            {/* Parenthesised so the number reads as the total, not a cap —
                "Show all 15" was being read as "show the top 15". */}
            {showAll ? `Show fewer` : `Show all (${levelled.length})`}
          </button>
        ) : null}
      </div>

      {user ? (
        <p className="tm-cloud-hint">Click a tag to add your vote · click again to remove it</p>
      ) : null}

      <div className="tm-cloud-chips">
        {visible.map((t) => (
          <RankedTagChip
            key={t.id}
            label={t.name}
            level={t.level}
            mine={t.mine}
            justVoted={justVoted === t.id}
            onVote={user ? () => vote(t) : undefined}
          />
        ))}
      </div>

      {!user ? (
        <div className="tm-cloud-foot">
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="tm-link tm-cloud-signin">
            Sign in to vote
          </Link>
        </div>
      ) : null}

      <div aria-live="polite" className="tm-sr-only">
        {status}
      </div>
    </section>
  );
}
