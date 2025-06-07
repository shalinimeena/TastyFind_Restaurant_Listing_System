// API Configuration - Single place to manage backend URL
export const API_CONFIG = {
  BASE_URL: 'https://shalinimeena--tastyfind-app-fastapi-app.modal.run',
} as const;

export const API_ENDPOINTS = {
  RESTAURANTS: '/restaurants',
  COUNTRIES: '/countries',
  SEARCH: '/restaurants/search',
  NEARBY: '/restaurants/nearby',
  SEMANTIC_SEARCH: '/semantic-search',
  IMAGE_SEARCH: '/image-search-nearby',
  RESTAURANT_BY_ID: '/restaurants',
} as const;