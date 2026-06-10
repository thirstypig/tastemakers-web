const WEEK_MS = 7 * 86400000;

/** Counts dates into `weeks` trailing 7-day buckets ending at `now`.
 *  Index weeks-1 = the most recent 7 days; index 0 = the oldest week. */
export function bucketByWeek(dates: string[], weeks: number, now: Date): number[] {
  const counts = new Array<number>(weeks).fill(0);
  const end = now.getTime();
  for (const d of dates) {
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) continue;
    const diff = end - t;
    if (diff < 0 || diff >= weeks * WEEK_MS) continue;
    counts[weeks - 1 - Math.floor(diff / WEEK_MS)]++;
  }
  return counts;
}
