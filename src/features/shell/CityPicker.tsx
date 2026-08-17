"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIES, DEFAULT_CITY } from "@/lib/api/cities";

const STORAGE_KEY = "tm-city";

/**
 * City picker in the purple bar.
 *
 * The choice lives in the URL (`?city=`) so the server can render for it, and
 * is mirrored to localStorage so it survives a fresh visit. It is deliberately
 * NOT a cookie: the app layout wraps the statically-generated restaurant
 * pages, and reading cookies there would make every one of them dynamic.
 */
export default function CityPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("city");
  const [city, setCity] = useState(fromUrl ?? DEFAULT_CITY);

  useEffect(() => {
    if (fromUrl) {
      window.localStorage.setItem(STORAGE_KEY, fromUrl);
      setCity(fromUrl);
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setCity(stored);
  }, [fromUrl]);

  function choose(next: string) {
    window.localStorage.setItem(STORAGE_KEY, next);
    setCity(next);
    router.push(`/?city=${encodeURIComponent(next)}`);
  }

  return (
    <label className="tm-topbar-city">
      <span className="tm-sr-only">Change city</span>
      <select
        value={CITIES.includes(city as (typeof CITIES)[number]) ? city : DEFAULT_CITY}
        onChange={(e) => choose(e.target.value)}
      >
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
