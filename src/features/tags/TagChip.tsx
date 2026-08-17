import type { CSSProperties } from "react";

/**
 * The tag chip. Built once, used everywhere.
 *
 * Two rules that look like bugs but are deliberate — do not "improve" them:
 *  1. Tags render in popularity order but display NO number and NO star.
 *     Popularity is expressed by order alone.
 *  2. The radius is 4px. These are squared chips, not pills.
 */

export type TagChipVariant =
  /** someone else's tag, on a restaurant */
  | "default"
  /** a tag you added, on a restaurant */
  | "added"
  /** a chip inside the "Your tags" card */
  | "mine"
  /** on a purple background (sidebar, hero, sign-in panel) */
  | "onPurple";

export type TagChipSize = "strip" | "cloud" | "desktop";

const VARIANTS: Record<TagChipVariant, { background: string; color: string; fontWeight: number }> = {
  default: { background: "var(--tm-tag)", color: "#fff", fontWeight: 500 },
  added: { background: "var(--tm-tag-light)", color: "#fff", fontWeight: 500 },
  mine: { background: "var(--tm-tag-mine-bg)", color: "var(--tm-tag-mine-fg)", fontWeight: 400 },
  onPurple: { background: "rgba(255,255,255,.14)", color: "#EDE9F7", fontWeight: 500 },
};

// Heights are fixed by the design: 24px in a list-card strip, 26px in a
// cloud, 30px on desktop. Padding and type scale with them.
const SIZES: Record<TagChipSize, { height: number; padding: string; fontSize: number }> = {
  strip: { height: 24, padding: "0 8px", fontSize: 12 },
  cloud: { height: 26, padding: "0 9px", fontSize: 13 },
  desktop: { height: 30, padding: "0 11px", fontSize: 14 },
};

interface Props {
  label: string;
  variant?: TagChipVariant;
  size?: TagChipSize;
  /** Renders a ✕ affordance and makes the chip a button. */
  onRemove?: () => void;
  /** Makes the chip a button that adds/toggles this tag. */
  onSelect?: () => void;
  /** Shows a leading + affordance, for the "Popular tags (choose any)" pool. */
  addable?: boolean;
  selected?: boolean;
}

export default function TagChip({
  label,
  variant = "default",
  size = "cloud",
  onRemove,
  onSelect,
  addable = false,
  selected = false,
}: Props) {
  const v = VARIANTS[variant];
  const s = SIZES[size];

  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: s.height,
    padding: s.padding,
    borderRadius: "var(--tm-radius-tag)",
    background: v.background,
    color: v.color,
    fontSize: s.fontSize,
    fontWeight: v.fontWeight,
    lineHeight: 1,
    border: 0,
    whiteSpace: "nowrap",
    maxWidth: "100%",
  };

  const interactive = Boolean(onRemove ?? onSelect);

  if (!interactive) {
    return <span style={style}>{label}</span>;
  }

  // A real <button> rather than role="button" on a span — it gets keyboard
  // activation, focus order and the disabled state for free. The focus ring
  // comes from `.tm-app :focus-visible` in globals.css (--tm-tag-light).
  return (
    <button
      type="button"
      onClick={onRemove ?? onSelect}
      aria-pressed={onSelect ? selected : undefined}
      aria-label={onRemove ? `Remove tag ${label}` : `Add tag ${label}`}
      style={{ ...style, cursor: "pointer" }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      {onRemove ? (
        <span aria-hidden="true" style={{ color: "#B9A9EA", fontWeight: 700 }}>
          ✕
        </span>
      ) : null}
      {addable && !onRemove ? (
        <span aria-hidden="true" style={{ color: "var(--tm-tag-light)", fontWeight: 700 }}>
          +
        </span>
      ) : null}
    </button>
  );
}
