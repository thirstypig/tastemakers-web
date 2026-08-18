import type { MetadataRoute } from "next";
import { listLists } from "@/features/lists/api";
import { listRestaurants } from "@/features/restaurants/api";
import { CANONICAL_ORIGIN, canonical } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [lists, restaurants] = await Promise.all([listLists(), listRestaurants()]);

  const listUrls = lists.map((l) => ({
    url: canonical(`/lists/${l.slug}`),
    lastModified: new Date(l.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const restaurantUrls = restaurants.map((r) => ({
    url: canonical(`/restaurants/${r.slug}`),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: CANONICAL_ORIGIN,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: canonical(`/lists`),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: canonical(`/restaurants`),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...listUrls,
    ...restaurantUrls,
  ];
}
