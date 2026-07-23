/**
 * Doc search — deliberately in its own module with NO Node imports.
 *
 * `docs.ts` imports `fs`/`path` at module scope, so anything a CLIENT component
 * imports from it drags `fs` into the browser bundle and the build fails with
 * "Module not found: Can't resolve 'fs'". Keep browser-safe helpers here.
 */

export type SearchableDoc = {
  title: string;
  id: string;
  path: string;
  tags: string[];
};

/** Matches on title, id, path, or any tag. Empty/whitespace query matches everything. */
export function matchesQuery(doc: SearchableDoc, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    doc.title.toLowerCase().includes(needle) ||
    doc.id.toLowerCase().includes(needle) ||
    doc.path.toLowerCase().includes(needle) ||
    doc.tags.some((t) => t.toLowerCase().includes(needle))
  );
}
