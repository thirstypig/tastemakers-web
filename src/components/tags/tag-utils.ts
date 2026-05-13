import type { Tag } from "@/lib/api/types";

// Vote-count thresholds that determine visual prominence.
// Mirrors the level system in iOS ColorExtension.swift — level 1 is darkest/most prominent.
export function voteCountToLevel(count: number): Tag["level"] {
  if (count >= 10) return 1;
  if (count >= 5) return 2;
  if (count >= 3) return 3;
  if (count >= 2) return 4;
  return 5;
}

// Exact colors from iOS ColorExtension.swift — do not adjust without updating the app too.
export const TAG_LEVEL_STYLES: Record<
  1 | 2 | 3 | 4 | 5,
  { bg: string; text: string }
> = {
  1: { bg: "#3D296E", text: "#ffffff" }, // level1Color — most popular
  2: { bg: "#594094", text: "#ffffff" }, // level2Color
  3: { bg: "#876DC4", text: "#ffffff" }, // level3Color
  4: { bg: "#876DC4", text: "#504273" }, // level4Color — same bg, textPurpleNew
  5: { bg: "#EFE8FE", text: "#8b81a3" }, // level5Color — least popular, textPurpleLight
};
