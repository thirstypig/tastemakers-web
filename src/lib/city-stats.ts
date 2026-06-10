export type CityEvent = { city: string | null; createdAt: string };
export type CityStat = { city: string; current: number; previous: number; delta: number };

/** Ranks cities by event count in the trailing `windowDays`; delta vs the prior window. */
export function cityLeaderboard(
  events: CityEvent[],
  now: Date,
  windowDays = 30,
  top = 8,
): CityStat[] {
  const windowMs = windowDays * 86400000;
  const end = now.getTime();
  const stats = new Map<string, { current: number; previous: number }>();
  for (const e of events) {
    const city = e.city?.trim();
    if (!city) continue;
    const t = new Date(e.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    const diff = end - t;
    if (diff < 0 || diff >= 2 * windowMs) continue;
    const s = stats.get(city) ?? { current: 0, previous: 0 };
    if (diff < windowMs) s.current++;
    else s.previous++;
    stats.set(city, s);
  }
  return [...stats.entries()]
    .map(([city, s]) => ({ city, ...s, delta: s.current - s.previous }))
    .filter((s) => s.current > 0)
    .sort((a, b) => b.current - a.current || a.city.localeCompare(b.city))
    .slice(0, top);
}
