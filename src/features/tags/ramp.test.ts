import { describe, expect, it } from "vitest";
import { TAG_RAMP, TAG_RAMP_HEIGHT } from "./ramp";
import type { TagLevel } from "./levels";

const LEVELS: TagLevel[] = [1, 2, 3, 4, 5];

// Resolved values for the CSS custom properties the ramp references, so the
// contrast assertions test the real colours rather than the var() strings.
const RESOLVED: Record<string, string> = {
  "var(--tm-purple)": "#2A1A5E",
  "var(--tm-tag)": "#3D2A75",
  "var(--tm-tag-light)": "#7C67B8",
  "var(--tm-ink)": "#1D1730",
};

/** CIE L* — perceptual lightness, which is what "looks different" tracks. */
function lstar(hex: string): number {
  const Y = luminance(hex);
  return Y > 0.008856 ? 116 * Y ** (1 / 3) - 16 : 903.3 * Y;
}

function luminance(hex: string): number {
  let h = hex.replace("#", "");
  // Expand shorthand (#fff → #ffffff) before slicing.
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const parts = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(parts[0]!) + 0.7152 * f(parts[1]!) + 0.0722 * f(parts[2]!);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const CARD = "#FFFFFF";

describe("tag ramp", () => {
  it("covers all five levels", () => {
    for (const l of LEVELS) {
      expect(TAG_RAMP[l]).toBeDefined();
      expect(TAG_RAMP_HEIGHT[l]).toBeGreaterThan(0);
    }
  });

  it("meets 4.5:1 for text on every filled chip", () => {
    for (const l of [1, 2, 3, 4] as TagLevel[]) {
      const step = TAG_RAMP[l];
      const bg = RESOLVED[step.background] ?? step.background;
      const fg = RESOLVED[step.color] ?? step.color;
      expect(contrast(fg, bg), `L${l} text on fill`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("meets 4.5:1 for the outline chip's text on a card", () => {
    // --tm-muted (#98939F) is 3.00:1 here and was rejected for this reason.
    expect(contrast(TAG_RAMP[5].color, CARD)).toBeGreaterThanOrEqual(4.5);
  });

  it("gets strictly less prominent as level increases", () => {
    // The property that broke when the dark ramp met a light canvas.
    const prominence = ([1, 2, 3, 4] as TagLevel[]).map((l) =>
      contrast(RESOLVED[TAG_RAMP[l].background] ?? TAG_RAMP[l].background, CARD),
    );
    for (let i = 0; i < prominence.length - 1; i++) {
      expect(prominence[i]!, `L${i + 1} vs L${i + 2}`).toBeGreaterThan(prominence[i + 1]!);
    }
  });

  it("carries strength in a second, non-colour channel", () => {
    // Greyscale / colour-blind safety: size and weight must also decay.
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const a = TAG_RAMP[LEVELS[i]!];
      const b = TAG_RAMP[LEVELS[i + 1]!];
      expect(a.fontSize).toBeGreaterThan(b.fontSize);
      expect(a.fontWeight).toBeGreaterThanOrEqual(b.fontWeight);
      expect(TAG_RAMP_HEIGHT[LEVELS[i]!]).toBeGreaterThan(TAG_RAMP_HEIGHT[LEVELS[i + 1]!]);
    }
  });

  it("spaces the filled levels evenly enough to tell apart", () => {
    // The original ramp stepped 7.8 / 10.4 / 15.0 L* — L1 and L2 read as the
    // same chip. Adjacent swatches need roughly 10 L* to separate at a glance.
    const ls = ([1, 2, 3, 4] as TagLevel[]).map((l) =>
      lstar(RESOLVED[TAG_RAMP[l].background] ?? TAG_RAMP[l].background),
    );
    const steps = ls.slice(1).map((v, i) => v - ls[i]!);

    for (const [i, step] of steps.entries()) {
      expect(step, `L${i + 1}→L${i + 2} step of ${step.toFixed(1)} L*`).toBeGreaterThan(10);
    }
    // And no step should dwarf the others — that was the L4→L5 cliff.
    expect(Math.max(...steps) / Math.min(...steps)).toBeLessThan(2);
  });

  it("keeps the weakest level as an outline rather than a fill", () => {
    expect(TAG_RAMP[5].background).toBe("transparent");
    expect(TAG_RAMP[5].border).toContain("var(--tm-border)");
  });
});
