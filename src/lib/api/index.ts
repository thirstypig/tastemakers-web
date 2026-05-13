import type { Tastemaker, CuratedList, Restaurant } from "./types";
import { STUB_TASTEMAKERS, STUB_LISTS, STUB_RESTAURANTS } from "./stubs";

// When a Laravel endpoint comes online, replace the stub call with:
//   import { apiFetch } from "./client";
//   return apiFetch<Tastemaker>(`/api/tastemakers/${slug}`);

export async function listTastemakers(): Promise<Tastemaker[]> {
  return STUB_TASTEMAKERS;
}

export async function getTastemaker(slug: string): Promise<Tastemaker | null> {
  return STUB_TASTEMAKERS.find((t) => t.slug === slug) ?? null;
}

export async function listLists(): Promise<CuratedList[]> {
  return STUB_LISTS;
}

export async function getList(slug: string): Promise<CuratedList | null> {
  return STUB_LISTS.find((l) => l.slug === slug) ?? null;
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  return STUB_RESTAURANTS.find((r) => r.id === id || r.slug === id) ?? null;
}

export async function listRestaurants(): Promise<Restaurant[]> {
  return STUB_RESTAURANTS;
}

export type { Tastemaker, CuratedList, Restaurant };
