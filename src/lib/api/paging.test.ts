import { describe, expect, it, vi } from "vitest";
import { fetchAllPages } from "./shared";

/** A fake table of `total` rows that honours range requests, capped per page. */
function fakeTable(total: number, cap = 1000) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i }));
  return vi.fn(async (from: number, to: number) =>
    rows.slice(from, Math.min(to + 1, from + cap)),
  );
}

describe("fetchAllPages", () => {
  it("returns every row when the table is larger than one page", async () => {
    const fetchPage = fakeTable(4230);
    const out = await fetchAllPages(fetchPage);

    expect(out).toHaveLength(4230);
    // 4230 rows = 4 full pages + a short one that ends the loop.
    expect(fetchPage).toHaveBeenCalledTimes(5);
  });

  it("stops after one call when the table fits in a page", async () => {
    const fetchPage = fakeTable(120);
    const out = await fetchAllPages(fetchPage);

    expect(out).toHaveLength(120);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("makes one extra call when the total is an exact multiple of the page", async () => {
    // The boundary case: a full page is indistinguishable from "more to come",
    // so it must ask again and get an empty page back.
    const fetchPage = fakeTable(2000);
    const out = await fetchAllPages(fetchPage);

    expect(out).toHaveLength(2000);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("requests contiguous, non-overlapping ranges", async () => {
    const fetchPage = fakeTable(2500);
    await fetchAllPages(fetchPage);

    expect(fetchPage.mock.calls.map(([from, to]) => [from, to])).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("handles an empty table", async () => {
    const fetchPage = fakeTable(0);
    expect(await fetchAllPages(fetchPage)).toEqual([]);
  });

  it("treats null as the end rather than throwing", async () => {
    const fetchPage = vi.fn(async () => null);
    expect(await fetchAllPages(fetchPage)).toEqual([]);
  });

  it("respects maxRows so a misbehaving source cannot loop forever", async () => {
    // A source that always returns a full page would otherwise never end.
    const endless = vi.fn(async (from: number) =>
      Array.from({ length: 1000 }, (_, i) => ({ id: from + i })),
    );
    const out = await fetchAllPages(endless, { maxRows: 3000 });

    expect(out).toHaveLength(3000);
    expect(endless).toHaveBeenCalledTimes(3);
  });

  it("honours a custom page size", async () => {
    const fetchPage = fakeTable(250, 100);
    const out = await fetchAllPages(fetchPage, { pageSize: 100 });

    expect(out).toHaveLength(250);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });
});
