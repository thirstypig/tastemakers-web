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
