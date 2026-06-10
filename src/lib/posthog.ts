const POSTHOG_HOST = "https://us.posthog.com";
const POSTHOG_PROJECT_ID = "455919";

export async function posthogQuery(
  apiKey: string,
  hogql: string,
): Promise<unknown[][] | null> {
  try {
    const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
      next: { revalidate: 300 },
    } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results as unknown[][]) ?? null;
  } catch {
    return null;
  }
}

export type WebStatDay = { day: string; views: number; visitors: number };
export type WebStats = { days: WebStatDay[]; visitors: number };

export async function fetchWebStats(apiKey: string): Promise<WebStats | null> {
  const [rows, totals] = await Promise.all([
    posthogQuery(
      apiKey,
      "SELECT toDate(timestamp) AS day, count(*) AS views, count(DISTINCT person_id) AS visitors " +
        "FROM events WHERE event = '$pageview' AND toDate(timestamp) >= today() - 7 " +
        "GROUP BY day ORDER BY day",
    ),
    posthogQuery(
      apiKey,
      "SELECT count(DISTINCT person_id) FROM events " +
        "WHERE event = '$pageview' AND toDate(timestamp) >= today() - 7",
    ),
  ]);
  if (!rows || !totals) return null;
  return {
    days: rows.map((r) => ({ day: String(r[0]), views: Number(r[1]), visitors: Number(r[2]) })),
    visitors: Number(totals[0]?.[0] ?? 0),
  };
}
