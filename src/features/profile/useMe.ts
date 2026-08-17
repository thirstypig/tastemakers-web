"use client";

import { useEffect, useState } from "react";

export interface MeSummary {
  name: string;
  stats: { tags: number; places: number; badges: number };
  recentTags: Array<{ id: string; name: string }>;
  badges: Array<{ id: string; name: string }>;
  bookmarks: {
    restaurants: Array<{ id: string; slug: string; name: string; address: string; imageUrl: string }>;
    lists: Array<{ id: string; slug: string; title: string; meta: string; thumbnailUrl: string }>;
  };
}

export type MeState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "unsynced" }
  | { status: "error"; message: string }
  | { status: "ready"; data: MeSummary };

/**
 * Load /api/me/summary.
 *
 * Distinguishes "not signed in" from "signed in but the Supabase identity has
 * no app_user_id yet" — the second is a real state here, because the Laravel
 * user row and the Supabase identity are linked through user_metadata, and the
 * two need different UI.
 */
export function useMe(): MeState {
  const [state, setState] = useState<MeState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/me/summary")
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return setState({ status: "anonymous" });
        if (res.status === 403) return setState({ status: "unsynced" });
        if (!res.ok) return setState({ status: "error", message: "Could not load your profile." });
        const data = (await res.json()) as MeSummary;
        setState({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "Could not load your profile." });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
