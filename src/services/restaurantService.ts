import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { Restaurant, RestaurantWithSimilarity, SearchFilters, GeolocationSearch, SemanticSearchRequest } from '../types/restaurant';

class RestaurantService {
  private baseUrl = API_CONFIG.BASE_URL;

  async getRestaurants(filters: SearchFilters): Promise<Restaurant[]> {
    const params = new URLSearchParams();
    
    if (filters.country) params.append('country', filters.country);
    if (filters.city) params.append('city', filters.city);
    if (filters.cuisine) params.append('cuisine', filters.cuisine);
    if (filters.minCost !== undefined) params.append('min_cost', filters.minCost.toString());
    if (filters.maxCost !== undefined) params.append('max_cost', filters.maxCost.toString());
    
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());

    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.RESTAURANTS}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch restaurants');
    return response.json();
  }

  async searchRestaurants(filters: {
    restaurantName?: string;
    city?: string;
    cuisine?: string;
    country?: string;
    limit?: number;
  }): Promise<Restaurant[]> {
    const params = new URLSearchParams();
    
    if (filters.restaurantName) params.append('q_name', filters.restaurantName);
    if (filters.city) params.append('q_city', filters.city);
    if (filters.cuisine) params.append('q_cuisine', filters.cuisine);
    if (filters.country) params.append('q_country', filters.country);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.SEARCH}?${params}`);
    if (!response.ok) throw new Error('Failed to search restaurants');
    return response.json();
  }

  async getRestaurantById(restaurantId: number): Promise<Restaurant> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.RESTAURANT_BY_ID}/${restaurantId}`);
    if (!response.ok) throw new Error('Restaurant not found');
    return response.json();
  }

  async getNearbyRestaurants(search: GeolocationSearch): Promise<Restaurant[]> {
    const params = new URLSearchParams({
      lat: search.latitude.toString(),
      lng: search.longitude.toString(),
      radius: search.radius.toString(),
      limit: search.limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.NEARBY}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch nearby restaurants');
    return response.json();
  }

  async semanticSearch(request: SemanticSearchRequest): Promise<RestaurantWithSimilarity[]> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.SEMANTIC_SEARCH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) throw new Error('Semantic search failed');
    return response.json();
  }

  async imageSearch(file: File, latitude: number, longitude: number, radius: number = 3.0, limit: number = 10): Promise<Restaurant[]> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lat', latitude.toString());
    formData.append('lng', longitude.toString());
    formData.append('radius', radius.toString());
    formData.append('limit', limit.toString());

    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.IMAGE_SEARCH}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Image search failed');
    return response.json();
  }

  async getCountries(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.COUNTRIES}`);
    if (!response.ok) throw new Error('Failed to fetch countries');
    return response.json();
  }
}

export const restaurantService = new RestaurantService();