export interface Restaurant {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  country: string;
  country_code: number;
  city: string;
  address: string;
  locality: string;
  locality_verbose: string;
  longitude: number;
  latitude: number;
  cuisines: string;
  average_cost_for_two: number;
  currency: string;
  has_table_booking: string;
  has_online_delivery: string;
  is_delivering_now: string;
  switch_to_order_menu: string;
  price_range: number;
  aggregate_rating: number;
  rating_color: string;
  rating_text: string;
  votes: number;
}

export interface RestaurantWithSimilarity extends Restaurant {
  similarity: number;
}

export interface SearchFilters {
  country?: string;
  city?: string;
  cuisine?: string;
  restaurantName?: string;
  restaurantId?: string;
  minCost?: number;
  maxCost?: number;
  page: number;
  limit: number;
}

export interface GeolocationSearch {
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
}

export interface SemanticSearchRequest {
  query: string;
  limit: number;
}