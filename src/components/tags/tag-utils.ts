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

// Colors from iOS ColorExtension.swift. Font weight added on web for extra hierarchy signal.
export const TAG_LEVEL_STYLES: Record<
  1 | 2 | 3 | 4 | 5,
  { bg: string; text: string; weight: string; opacity: string }
> = {
  1: { bg: "#3D296E", text: "#ffffff", weight: "700", opacity: "1"    }, // most popular — bold, full opacity
  2: { bg: "#594094", text: "#ffffff", weight: "600", opacity: "1"    },
  3: { bg: "#876DC4", text: "#ffffff", weight: "500", opacity: "0.9"  },
  4: { bg: "#876DC4", text: "#504273", weight: "400", opacity: "0.75" },
  5: { bg: "#EFE8FE", text: "#8b81a3", weight: "400", opacity: "0.55" }, // least popular — fades back
};
