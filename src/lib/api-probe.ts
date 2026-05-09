export type Check = {
  name: string;
  description: string;
  method: string;
  url: string;
  expectStatus: number;
  note?: string;
  init?: RequestInit;
};

export type CheckResult = Check & {
  status: number | null;
  ok: boolean;
  ms: number;
  body: unknown;
  error?: string;
};

export async function runCheck(check: Check): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(check.url, {
      method: check.method,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      ...check.init,
    });
    const ms = Date.now() - start;
    let body: unknown = null;
    try {
      const text = await res.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return {
      ...check,
      status: res.status,
      ok: res.status === check.expectStatus,
      ms,
      body,
    };
  } catch (e) {
    return {
      ...check,
      status: null,
      ok: false,
      ms: Date.now() - start,
      body: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function shortBody(body: unknown): string {
  if (body === null || body === undefined) return "—";
  const s = JSON.stringify(body, null, 2);
  if (s.length <= 300) return s;
  return s.slice(0, 300) + "\n…";
}
