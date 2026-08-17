export interface Tag {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
  count?: number; // vote count — how many users applied this tag to a restaurant
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  neighborhood: string;
  city: string;
  cuisine: string;
  imageUrl: string;
  tags: Tag[];
  foursquareId?: string;
  latitude?: number;
  longitude?: number;
}

export interface RestaurantPhoto {
  id: string;
  url: string;
  /** Heart count. Only populated where it's displayed (the photo grid). */
  hearts?: number;
}

/** A list this restaurant appears on, for the detail page's right rail. */
export interface ListSummary {
  id: string;
  slug: string;
  title: string;
  meta: string;
  thumbnailUrl: string;
}

/**
 * Everything the restaurant detail page needs.
 *
 * `phone`, `website` and `photos` are optional/empty on purpose: the
 * production `restaurants` table has `contact` and `website` columns but
 * both are unpopulated across all 1,388 rows, and `restaurant_images` is
 * empty. The page omits those rows rather than inventing them, so it fills
 * in on its own once Foursquare enrichment or photo upload lands.
 */
export interface RestaurantDetail extends Restaurant {
  phone?: string;
  website?: string;
  photos: RestaurantPhoto[];
  onLists: ListSummary[];
}

export interface CuratedList {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  restaurantCount: number;
  restaurants: Restaurant[];
  createdAt: string;
  curatorName?: string;
}

export interface Tastemaker {
  id: string;
  slug: string;
  name: string;
  username: string;
  bio: string;
  avatarUrl: string;
  location: string;
  followerCount: number;
  listCount: number;
  level: 1 | 2 | 3 | 4 | 5;
  lists: CuratedList[];
  tags: Tag[];
}
