import { useState, useCallback } from 'react';
import { Restaurant, RestaurantWithSimilarity, SearchFilters, GeolocationSearch, SemanticSearchRequest } from '../types/restaurant';
import { restaurantService } from '../services/restaurantService';

interface UseRestaurantsReturn {
  restaurants: Restaurant[] | RestaurantWithSimilarity[];
  loading: boolean;
  error: string | null;
  totalResults: number;
  currentPage: number;
  resultsPerPage: number;
  lastSearchType: string | null;
  lastSearchParams: any;
  searchRestaurants: (filters: SearchFilters) => Promise<void>;
  searchByQuery: (filters: any) => Promise<void>;
  searchNearby: (search: GeolocationSearch) => Promise<void>;
  semanticSearch: (request: SemanticSearchRequest) => Promise<void>;
  imageSearch: (file: File, lat: number, lng: number, radius: number) => Promise<void>;
  browseAllRestaurants: (page?: number, limit?: number) => Promise<void>;
  getRestaurantById: (restaurantId: number) => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  clearResults: () => void;
}

export const useRestaurants = (): UseRestaurantsReturn => {
  const [restaurants, setRestaurants] = useState<Restaurant[] | RestaurantWithSimilarity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(20);
  const [lastSearchType, setLastSearchType] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<any>(null);

  const searchRestaurants = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setLastSearchType('basic');
    setLastSearchParams(filters);
    
    try {
      const results = await restaurantService.getRestaurants(filters);
      setRestaurants(results);
      setTotalResults(results.length);
      setCurrentPage(filters.page);
      setResultsPerPage(filters.limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setRestaurants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByQuery = useCallback(async (filters: any) => {
    setLoading(true);
    setError(null);
    setLastSearchType('query');
    setLastSearchParams(filters);
    
    try {
      const results = await restaurantService.searchRestaurants(filters);
      setRestaurants(results);
      setTotalResults(results.length);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setRestaurants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRestaurantById = useCallback(async (restaurantId: number) => {
    setLoading(true);
    setError(null);
    setLastSearchType('restaurantId');
    setLastSearchParams({ restaurantId });
    
    try {
      const result = await restaurantService.getRestaurantById(restaurantId);
      setRestaurants([result]);
      setTotalResults(1);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restaurant not found');
      setRestaurants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchNearby = useCallback(async (search: GeolocationSearch) => {
    setLoading(true);
    setError(null);
    setLastSearchType('nearby');
    setLastSearchParams(search);
    
    try {
      const results = await restaurantService.getNearbyRestaurants(search);
      setRestaurants(results);
      setTotalResults(results.length);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location search failed');
      setRestaurants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const semanticSearch = useCallback(async (request: SemanticSearchRequest) => {
    setLoading(true);
    setError(null);
    setLastSearchType('semantic');
    setLastSearchParams(request);
    
    try {
      const results = await restaurantService.semanticSearch(request);
      setRestaurants(results);
      setTotalResults(results.length);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Semantic search failed');
      setRestaurants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const imageSearch = useCallback(async (file: File, lat: number, lng: number, radius: number) => {
    setLoading(true);
    setError(null);
    setLastSearchType('image');
    setLastSearchParams({ file, lat, lng, radius });
    
    try {
      const results = await restaurantService.imageSearch(file, lat, lng, radius);
      setRestaurants(results);
      setTotalResults(results.length);
      setCurrentPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image search failed');
      setRestaurants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const browseAllRestaurants = useCallback(async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    setError(null);
    setLastSearchType('browse');
    setLastSearchParams({ page, limit });
    
    try {
      const results = await restaurantService.getRestaurants({ page, limit });
      setRestaurants(results);
      setTotalResults(results.length);
      setCurrentPage(page);
      setResultsPerPage(limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
      setRestaurants([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
    
    // Re-execute the last search with the new page
    if (lastSearchType && lastSearchParams) {
      switch (lastSearchType) {
        case 'basic':
          searchRestaurants({ ...lastSearchParams, page });
          break;
        case 'browse':
          browseAllRestaurants(page, resultsPerPage);
          break;
        case 'query':
          // Query searches don't support pagination in the backend
          break;
        case 'restaurantId':
          // Restaurant ID searches don't support pagination
          break;
        case 'nearby':
          // Nearby searches don't support pagination in the backend
          break;
        case 'semantic':
          // Semantic searches don't support pagination in the backend
          break;
        case 'image':
          // Image searches don't support pagination in the backend
          break;
      }
    }
  }, [lastSearchType, lastSearchParams, resultsPerPage, searchRestaurants, browseAllRestaurants]);

  const setPageSize = useCallback((pageSize: number) => {
    setResultsPerPage(pageSize);
    setCurrentPage(1);
    
    // Re-execute the last search with the new page size
    if (lastSearchType && lastSearchParams) {
      switch (lastSearchType) {
        case 'basic':
          searchRestaurants({ ...lastSearchParams, page: 1, limit: pageSize });
          break;
        case 'browse':
          browseAllRestaurants(1, pageSize);
          break;
        case 'query':
          searchByQuery({ ...lastSearchParams, limit: pageSize });
          break;
        case 'nearby':
          searchNearby({ ...lastSearchParams, limit: pageSize });
          break;
        case 'semantic':
          semanticSearch({ ...lastSearchParams, limit: pageSize });
          break;
        case 'image':
          // Image search limit is handled differently
          break;
      }
    }
  }, [lastSearchType, lastSearchParams, searchRestaurants, browseAllRestaurants, searchByQuery, searchNearby, semanticSearch]);

  const clearResults = useCallback(() => {
    setRestaurants([]);
    setTotalResults(0);
    setCurrentPage(1);
    setError(null);
    setLastSearchType(null);
    setLastSearchParams(null);
  }, []);

  return {
    restaurants,
    loading,
    error,
    totalResults,
    currentPage,
    resultsPerPage,
    lastSearchType,
    lastSearchParams,
    searchRestaurants,
    searchByQuery,
    searchNearby,
    semanticSearch,
    imageSearch,
    browseAllRestaurants,
    getRestaurantById,
    setPage,
    setPageSize,
    clearResults,
  };
};