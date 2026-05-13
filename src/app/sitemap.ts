import type { MetadataRoute } from "next";
import { listTastemakers, listLists, listRestaurants } from "@/lib/api/index";

const SITE_URL = "https://app.tastemakersapp.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tastemakers, lists, restaurants] = await Promise.all([
    listTastemakers(),
    listLists(),
    listRestaurants(),
  ]);

  const tastemakerUrls = tastemakers.map((t) => ({
    url: `${SITE_URL}/tastemakers/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const listUrls = lists.map((l) => ({
    url: `${SITE_URL}/lists/${l.slug}`,
    lastModified: new Date(l.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const restaurantUrls = restaurants.map((r) => ({
    url: `${SITE_URL}/restaurants/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/tastemakers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...tastemakerUrls,
    ...listUrls,
    ...restaurantUrls,
  ];
}
