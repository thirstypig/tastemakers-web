/**
 * Ramp specimen — every level side by side, plus a greyscale copy.
 *
 * Production has every tag at L1 (todo 067 caps all counts at 1), so this is
 * the only place the ramp can actually be seen. Dev-only: it 404s in a
 * production build rather than shipping a design page to real visitors.
 */
import { notFound } from "next/navigation";
import RankedTagChip from "@/features/tags/RankedTagChip";
import type { TagLevel } from "@/features/tags/levels";

const ROWS: Array<{ level: TagLevel; meaning: string; example: string; tag: string }> = [
  { level: 1, meaning: "Ties for most-tagged", example: "9 of 9 votes", tag: "Would Recommend" },
  { level: 2, meaning: "One vote behind", example: "8 of 9", tag: "Unique Dishes" },
  { level: 3, meaning: "Two behind", example: "7 of 9", tag: "Good Flavor" },
  { level: 4, meaning: "Three behind", example: "6 of 9", tag: "top chef" },
  { level: 5, meaning: "Four or more behind", example: "5 or fewer", tag: "Good Variety" },
];

const CLOUD: Array<{ tag: string; level: TagLevel; mine?: boolean }> = [
  { tag: "Would Recommend", level: 1 },
  { tag: "Popular/Trendy", level: 1 },
  { tag: "Unique Dishes", level: 2 },
  { tag: "Great Decor", level: 2, mine: true },
  { tag: "Good Flavor", level: 3 },
  { tag: "great brunch", level: 3 },
  { tag: "top chef", level: 4, mine: true },
  { tag: "Not so Cheap $$", level: 5 },
  { tag: "Good Variety", level: 5 },
  { tag: "Great Service", level: 5 },
];

export default function RampSpecimen() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="tm-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>The five levels</h1>
        <div style={{ display: "grid", gap: 12 }}>
          {ROWS.map((r) => (
            <div
              key={r.level}
              style={{
                display: "grid",
                gridTemplateColumns: "34px 190px 1fr",
                alignItems: "center",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--tm-tag-mine-fg)" }}>
                L{r.level}
              </span>
              <RankedTagChip label={r.tag} level={r.level} />
              <span style={{ fontSize: 13, color: "#6F6A80" }}>
                {r.meaning} <span style={{ color: "var(--tm-faint)" }}>· {r.example}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="tm-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>In a cloud</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {CLOUD.map((c) => (
            <RankedTagChip key={c.tag} label={c.tag} level={c.level} mine={c.mine} />
          ))}
        </div>
      </div>

      <div className="tm-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Same cloud, no colour</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6F6A80" }}>
          If the order still reads here, the hierarchy does not depend on colour vision.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            filter: "grayscale(1)",
          }}
        >
          {CLOUD.map((c) => (
            <RankedTagChip key={c.tag} label={c.tag} level={c.level} mine={c.mine} />
          ))}
        </div>
      </div>
    </div>
  );
}
