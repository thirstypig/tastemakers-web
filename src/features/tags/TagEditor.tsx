"use client";

import "./tags.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TagChip from "./TagChip";
import { POPULAR_TAG_POOL, TAG_MAX_LENGTH, normalizeTag, validateNewTag } from "@/features/tags/vocabulary";

export interface EditorTag {
  id: string;
  name: string;
}

type SaveOutcome = { name: string; ok: boolean; message?: string };

/**
 * Add / review tags. Expands on the restaurant page itself — no separate route.
 *
 * Three cards mirroring the app: Your tags (removable), Create New Tags
 * (17 character limit), Popular tags (choose any), with a sticky SAVE TAG.
 *
 * Saving is optimistic: pending tags move into "Your tags" immediately and are
 * rolled back individually if the server rejects them. That rollback is load
 * bearing right now — production's UNIQUE (restaurant_id, tag_id) means a tag
 * another user already applied here is refused (409 vote_blocked).
 */
export default function TagEditor({
  restaurantId,
  restaurantTags,
  onClose,
}: {
  restaurantId: string;
  restaurantTags: EditorTag[];
  onClose: () => void;
}) {
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const nameById = useMemo(
    () => new Map(restaurantTags.map((t) => [t.id, t.name])),
    [restaurantTags],
  );

  // Every tag name in play, for case/whitespace-insensitive dedupe.
  const knownNames = useMemo(() => {
    const all = [...restaurantTags.map((t) => t.name), ...POPULAR_TAG_POOL];
    const seen = new Map<string, string>();
    for (const n of all) if (!seen.has(normalizeTag(n))) seen.set(normalizeTag(n), n);
    return [...seen.values()];
  }, [restaurantTags]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/restaurants/${restaurantId}/my-tags`)
      .then((r) => r.json())
      .then((d: { tag_ids?: Array<string | number> }) => {
        if (cancelled) return;
        const names = (d.tag_ids ?? [])
          .map((id) => nameById.get(String(id)))
          .filter((n): n is string => Boolean(n));
        setSavedNames(names);
      })
      .catch(() => {
        if (!cancelled) setStatus("Could not load your tags.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, nameById]);

  const isChosen = useCallback(
    (name: string) => {
      const key = normalizeTag(name);
      return (
        savedNames.some((n) => normalizeTag(n) === key) ||
        pending.some((n) => normalizeTag(n) === key)
      );
    },
    [savedNames, pending],
  );

  function togglePopular(name: string) {
    if (isChosen(name)) return;
    setPending((p) => [...p, name]);
    setStatus(`${name} added. Not saved yet.`);
  }

  function removePending(name: string) {
    setPending((p) => p.filter((n) => n !== name));
    setStatus(`${name} removed.`);
  }

  async function removeSaved(name: string) {
    const tag = restaurantTags.find((t) => normalizeTag(t.name) === normalizeTag(name));
    const before = savedNames;
    setSavedNames((s) => s.filter((n) => n !== name)); // optimistic
    setStatus(`${name} removed.`);

    if (!tag) return;
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/tag`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: Number(tag.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSavedNames(before); // rollback
      setStatus(`Could not remove ${name}. Put it back.`);
    }
  }

  function addDraft() {
    const result = validateNewTag(draft, knownNames);
    if (!result.ok) {
      setDraftError(
        result.reason === "empty"
          ? "Type a tag first."
          : `Tags are ${TAG_MAX_LENGTH} characters or fewer.`,
      );
      return;
    }
    if (isChosen(result.tag)) {
      setDraftError(`${result.tag} is already on your list.`);
      return;
    }
    setPending((p) => [...p, result.tag]);
    setDraft("");
    setDraftError(null);
    setStatus(
      result.kind === "existing"
        ? `${result.tag} added — reusing the existing tag.`
        : `${result.tag} added. Not saved yet.`,
    );
    inputRef.current?.focus();
  }

  async function save() {
    if (pending.length === 0 || saving) return;
    setSaving(true);

    const committed = pending;
    setSavedNames((s) => [...s, ...committed]); // optimistic
    setPending([]);
    setStatus(`Saving ${committed.length} ${committed.length === 1 ? "tag" : "tags"}…`);

    const outcomes: SaveOutcome[] = await Promise.all(
      committed.map(async (name): Promise<SaveOutcome> => {
        const existing = restaurantTags.find(
          (t) => normalizeTag(t.name) === normalizeTag(name),
        );
        try {
          const res = await fetch(`/api/restaurants/${restaurantId}/tag`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              existing ? { tag_id: Number(existing.id) } : { tag_name: name },
            ),
          });
          if (res.ok) return { name, ok: true };
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
            code?: string;
          };
          return { name, ok: false, message: body.error };
        } catch {
          return { name, ok: false, message: "Network error." };
        }
      }),
    );

    const failed = outcomes.filter((o) => !o.ok);
    if (failed.length > 0) {
      const failedKeys = new Set(failed.map((f) => normalizeTag(f.name)));
      setSavedNames((s) => s.filter((n) => !failedKeys.has(normalizeTag(n)))); // rollback
      setStatus(
        failed.length === 1
          ? `${failed[0]!.name} could not be saved. ${failed[0]!.message ?? ""}`.trim()
          : `${failed.length} tags could not be saved.`,
      );
    } else {
      setStatus(
        `Saved ${committed.length} ${committed.length === 1 ? "tag" : "tags"}.`,
      );
    }

    setSaving(false);
  }

  const overLimit = draft.trim().length > TAG_MAX_LENGTH;

  return (
    <div className="tm-editor">
      {/* Card 1 — Your tags (removable) */}
      <section className="tm-card tm-editor-card">
        <div className="tm-editor-head">
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Your tags</h2>
          <button type="button" className="tm-editor-close" onClick={onClose}>
            Done
          </button>
        </div>

        {loading ? (
          // Skeleton matches the chip row it replaces, not a bare spinner.
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }} aria-hidden="true">
            {[92, 128, 74].map((w) => (
              <span key={w} className="tm-skel" style={{ width: w, height: 26 }} />
            ))}
          </div>
        ) : savedNames.length === 0 && pending.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--tm-muted)" }}>
            No tags yet — be the first to tag this place.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {savedNames.map((n) => (
              <TagChip key={`s-${n}`} label={n} variant="mine" onRemove={() => removeSaved(n)} />
            ))}
            {pending.map((n) => (
              <TagChip key={`p-${n}`} label={n} variant="added" onRemove={() => removePending(n)} />
            ))}
          </div>
        )}
      </section>

      {/* Card 2 — Create New Tags */}
      <section className="tm-card tm-editor-card">
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>
          Create New Tags{" "}
          <span className="tm-editor-hint">({TAG_MAX_LENGTH} characters limit)</span>
        </h2>
        <div className="tm-editor-newrow" style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            className="tm-editor-input"
            value={draft}
            maxLength={TAG_MAX_LENGTH * 2}
            aria-label={`Create a new tag, ${TAG_MAX_LENGTH} characters maximum`}
            aria-invalid={overLimit || Boolean(draftError)}
            placeholder="Great Service or Bad Parking or Tasty Burgers"
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
          />
          <button
            type="button"
            className="tm-btn tm-btn-primary"
            onClick={addDraft}
            disabled={draft.trim().length === 0}
          >
            Add
          </button>
        </div>
        <div className="tm-editor-meta">
          <span style={{ color: draftError ? "var(--tm-crimson)" : "var(--tm-muted)" }}>
            {draftError ?? "Reuse an existing tag when you can — it counts as a vote."}
          </span>
          <span style={{ color: overLimit ? "var(--tm-crimson)" : "var(--tm-faint)" }}>
            {draft.trim().length}/{TAG_MAX_LENGTH}
          </span>
        </div>
      </section>

      {/* Card 3 — Popular tags */}
      <section className="tm-card tm-editor-card">
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>
          Popular tags <span className="tm-editor-hint">(choose any)</span>
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {POPULAR_TAG_POOL.map((name) => (
            <TagChip
              key={name}
              label={name}
              addable
              selected={isChosen(name)}
              variant={isChosen(name) ? "mine" : "default"}
              onSelect={() => togglePopular(name)}
            />
          ))}
        </div>
      </section>

      <div aria-live="polite" className="tm-sr-only">
        {status}
      </div>

      <div className="tm-editor-save">
        <button
          type="button"
          className="tm-btn tm-btn-primary"
          style={{ width: "100%", minHeight: 52 }}
          onClick={save}
          disabled={pending.length === 0 || saving}
        >
          {saving
            ? "Saving…"
            : pending.length > 0
              ? `Save ${pending.length} ${pending.length === 1 ? "tag" : "tags"}`
              : "Save tag"}
        </button>
      </div>
    </div>
  );
}
