"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePublicAuth } from "@/hooks/usePublicAuth";
import { TAG_LEVEL_STYLES } from "./tag-utils";
import type { Tag } from "@/lib/api/types";

interface Props {
  restaurantId: string;
  initialTags: Tag[];
}

export function TagReview({ restaurantId, initialTags }: Props) {
  const { user, appUserId } = usePublicAuth();
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [myTagIds, setMyTagIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch user's existing votes when panel opens
  useEffect(() => {
    if (!open || !user) return;
    fetch(`/api/restaurants/${restaurantId}/my-tags`)
      .then((r) => r.json())
      .then((data: { tag_ids: number[] }) => setMyTagIds(new Set(data.tag_ids)))
      .catch(() => {});
  }, [open, user, restaurantId]);

  // Typeahead search
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/tags/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data: { tags: { id: number; name: string }[] }) => {
          // Filter out tags already on this restaurant
          const existingIds = new Set(tags.map((t) => Number(t.id)));
          setSuggestions(data.tags.filter((t) => !existingIds.has(t.id)));
        })
        .catch(() => {});
    }, 200);
  }, [tags]);

  async function toggleTag(tag: Tag) {
    if (!appUserId) return;
    const numId = Number(tag.id);
    if (pendingIds.has(numId)) return;

    setPendingIds((p) => new Set([...p, numId]));
    const isVoted = myTagIds.has(numId);

    const res = await fetch(`/api/restaurants/${restaurantId}/tag`, {
      method: isVoted ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_id: numId }),
    });

    if (res.ok) {
      setMyTagIds((prev) => {
        const next = new Set(prev);
        isVoted ? next.delete(numId) : next.add(numId);
        return next;
      });
      // Update vote count on the tag locally
      setTags((prev) => prev.map((t) =>
        t.id === tag.id
          ? { ...t, count: Math.max(0, (t.count ?? 1) + (isVoted ? -1 : 1)) }
          : t,
      ));
    }
    setPendingIds((p) => { const next = new Set(p); next.delete(numId); return next; });
  }

  async function addNewTag(name: string) {
    const trimmed = name.trim().slice(0, 17);
    if (!trimmed || !appUserId) return;
    setSaving(true);

    const res = await fetch(`/api/restaurants/${restaurantId}/tag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_name: trimmed }),
    });

    if (res.ok) {
      const data = await res.json() as { tag_id: number };
      // Add new tag to the local list if not already present
      if (!tags.find((t) => t.id === String(data.tag_id))) {
        setTags((prev) => [
          { id: String(data.tag_id), name: trimmed, level: 5, count: 1 },
          ...prev,
        ]);
      }
      setMyTagIds((prev) => new Set([...prev, data.tag_id]));
    }

    setInput("");
    setSuggestions([]);
    setSaving(false);
    inputRef.current?.focus();
  }

  if (!user) {
    return (
      <a
        href="/login"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginTop: 12,
          padding: "8px 16px",
          borderRadius: 6,
          border: "1px solid #3D2E6E",
          color: "#8b81a3",
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        Sign in to review tags
      </a>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "8px 18px",
            borderRadius: 6,
            border: "none",
            background: "#DB1657",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.01em",
          }}
        >
          Review Tags
        </button>
      ) : (
        <div
          style={{
            background: "#2A1A60",
            border: "1px solid #3D2E6E",
            borderRadius: 10,
            padding: "20px",
          }}
        >
          {/* Header */}
          <p style={{ color: "#B7ADCF", fontSize: 13, margin: "0 0 14px", fontWeight: 500 }}>
            Tap a tag to add your vote
          </p>

          {/* Existing tags — tappable */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {tags.map((tag) => {
              const numId = Number(tag.id);
              const voted = myTagIds.has(numId);
              const pending = pendingIds.has(numId);
              const { bg, text, weight } = TAG_LEVEL_STYLES[tag.level] ?? TAG_LEVEL_STYLES[5];
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag)}
                  disabled={pending}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: voted ? "2px solid #DB1657" : "2px solid transparent",
                    background: bg,
                    color: text,
                    fontWeight: weight,
                    fontSize: 13,
                    cursor: pending ? "wait" : "pointer",
                    opacity: pending ? 0.6 : 1,
                    transition: "border-color 0.15s, opacity 0.15s",
                  }}
                >
                  {tag.name}
                  {voted && (
                    <span style={{ marginLeft: 4, color: "#DB1657", fontSize: 11 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Add new tag */}
          <p style={{ color: "#B7ADCF", fontSize: 13, margin: "0 0 8px", fontWeight: 500 }}>
            Add a tag <span style={{ color: "#8b81a3", fontWeight: 400 }}>(max 17 chars)</span>
          </p>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 17);
                  setInput(val);
                  search(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) {
                    e.preventDefault();
                    addNewTag(input);
                  }
                  if (e.key === "Escape") setSuggestions([]);
                }}
                placeholder="e.g. Great for dates"
                maxLength={17}
                style={{
                  flex: 1,
                  background: "#1A1038",
                  border: "1px solid #3D2E6E",
                  borderRadius: 6,
                  color: "#fff",
                  fontSize: 14,
                  padding: "9px 12px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => addNewTag(input)}
                disabled={!input.trim() || saving}
                style={{
                  padding: "9px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: input.trim() ? "#DB1657" : "#3D2E6E",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: input.trim() ? "pointer" : "default",
                  transition: "background 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {saving ? "…" : "Add"}
              </button>
            </div>

            {/* Typeahead suggestions */}
            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 48,
                  background: "#1A1038",
                  border: "1px solid #3D2E6E",
                  borderRadius: 6,
                  overflow: "hidden",
                  zIndex: 10,
                }}
              >
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setInput(s.name);
                      setSuggestions([]);
                      addNewTag(s.name);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "9px 12px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid #2A1A60",
                      color: "#B7ADCF",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2A1A60"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Char counter + close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ color: "#8b81a3", fontSize: 12 }}>
              {input.length}/17
            </span>
            <button
              onClick={() => { setOpen(false); setSuggestions([]); setInput(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: "#8b81a3",
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
