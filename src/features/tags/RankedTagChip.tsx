import type { CSSProperties } from "react";
import type { TagLevel } from "./levels";
import { MY_VOTE_RING, TAG_RAMP, TAG_RAMP_HEIGHT } from "./ramp";

/**
 * A tag chip whose appearance carries its level.
 *
 * Distinct from `TagChip`, which is the flat two-fill chip used where level is
 * not the point (the editor's pools, the "Your tags" card, the sign-in cloud).
 * This one is for ranked clouds — the restaurant detail page and result cards —
 * where relative strength is the information being shown.
 *
 * Still shows no number: strength is the fill, the size and the order.
 */
export default function RankedTagChip({
  label,
  level,
  mine = false,
  onVote,
  justVoted = false,
}: {
  label: string;
  level: TagLevel;
  mine?: boolean;
  onVote?: () => void;
  justVoted?: boolean;
}) {
  const step = TAG_RAMP[level];

  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    height: TAG_RAMP_HEIGHT[level],
    padding: step.padding,
    borderRadius: "var(--tm-radius-tag)",
    background: step.background,
    color: step.color,
    fontSize: step.fontSize,
    fontWeight: step.fontWeight,
    fontFamily: "inherit",
    lineHeight: 1,
    border: step.border,
    boxShadow: mine ? MY_VOTE_RING : undefined,
    whiteSpace: "nowrap",
    maxWidth: "100%",
    transition: "background .28s ease, color .28s ease, height .28s ease, box-shadow .18s ease",
    animation: justVoted ? "tm-pop .4s ease" : undefined,
  };

  if (!onVote) {
    return <span style={style}>{label}</span>;
  }

  return (
    <button
      type="button"
      onClick={onVote}
      aria-pressed={mine}
      // The level is visual; say it out loud for anyone who can't see the ramp.
      aria-label={`${label}, strength ${level} of 5${mine ? ", you voted for this" : ""}`}
      style={{ ...style, cursor: "pointer" }}
    >
      {label}
    </button>
  );
}
