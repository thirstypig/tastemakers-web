const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.tastemakersapp.com";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
    next: { revalidate: 300 }, // 5-minute ISR cache for public pages
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${path}`);
  }

  const json = await res.json();
  // Laravel wraps in { status, data, message }
  return (json.data ?? json) as T;
}
