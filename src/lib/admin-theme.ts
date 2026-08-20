/**
 * The one theme object the admin pages share.
 *
 * Four pages each declared their own `const t = {...}`. Three had been migrated
 * to `var(--tm-*)`; `admin/api` had not, and still carried the original
 * hardcoded palette (`#0f0f23`, `#e2e8f0`, …) plus system fonts. Those values
 * only ever look dark, so the ⊙ light/dark toggle in the admin header did
 * nothing on that page while working everywhere else — and nothing failed,
 * because a hex string is as valid as a var reference.
 *
 * That is the half-applied shape this codebase keeps producing: a correct fix
 * landed at three of four sites. A single exported object is the structural
 * answer — there is no longer a fourth copy to miss.
 *
 * See `admin-theme.test.ts`, which fails if a page reintroduces a local
 * hardcoded palette.
 */

/**
 * Roles that MUST follow the theme. Each maps to a CSS variable defined for
 * both the Paper and Gruvbox admin themes, so the toggle drives all of them.
 */
const THEMED = {
  bg: "var(--tm-bg)",
  surface: "var(--tm-panel)",
  border: "var(--tm-line)",
  text: "var(--tm-ink)",
  muted: "var(--tm-muted)",
  dim: "var(--tm-muted)",
  accent: "var(--tm-accent)",
  /** Error / P1 / destructive state. */
  err: "var(--tm-err)",
  /** Warning / P2 state. */
  warn: "var(--tm-warn)",
} as const;

/**
 * Data-visualisation colours, deliberately NOT themed.
 *
 * These carry meaning independent of light/dark — a green bar means "healthy"
 * on either background — so they stay fixed. Do not "fix" them into variables:
 * that is the documented exception, not an oversight.
 *
 * Use `err`/`warn` above for anything that is a *state*, and these for anything
 * that is a *series*.
 */
const DATAVIZ = {
  green: "#34d399",
  yellow: "#facc15",
  red: "#f87171",
  purple: "#a78bfa",
  orange: "#fb923c",
  cyan: "#22d3ee",
} as const;

const TYPE = {
  font: "var(--font-jetbrains-mono), monospace",
  mono: "var(--font-jetbrains-mono), monospace",
} as const;

export const ADMIN_THEME = { ...THEMED, ...DATAVIZ, ...TYPE } as const;

/** Role names that must never be a literal colour. Consumed by the guard test. */
export const THEMED_ROLES = Object.keys(THEMED) as ReadonlyArray<keyof typeof THEMED>;

export type AdminTheme = typeof ADMIN_THEME;
