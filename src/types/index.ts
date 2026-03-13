export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  image: string | null;
  description: string | null;
}

export interface Restaurant {
  id: number;
  place_id: string;
  name: string;
  address: string;
  lat: string;
  lng: string;
  city: string;
  country: string;
}

export interface Tag {
  id: number;
  tag_name: string;
}

export interface TastemakerList {
  id: number;
  name: string;
  restaurants: Restaurant[];
}
