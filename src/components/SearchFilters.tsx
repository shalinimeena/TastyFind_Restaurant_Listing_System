import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Image, Zap, List } from 'lucide-react';
import { restaurantService } from '../services/restaurantService';

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
  onSearch: (type: string, data: any) => void;
  onBrowseAll: (page?: number, limit?: number) => void;
  loading: boolean;
  resultsPerPage: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  onFiltersChange, 
  onSearch, 
  onBrowseAll, 
  loading,
  resultsPerPage 
}) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'semantic' | 'image' | 'browse'>('browse');
  
  // Basic search states
  const [selectedCountry, setSelectedCountry] = useState('');
  const [city, setCity] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');

  // Location search states
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('5');

  // Semantic search states
  const [semanticQuery, setSemanticQuery] = useState('');

  // Image search states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSearchLat, setImageSearchLat] = useState('');
  const [imageSearchLng, setImageSearchLng] = useState('');
  const [imageSearchRadius, setImageSearchRadius] = useState('3');

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      const countryList = await restaurantService.getCountries();
      setCountries(countryList);
    } catch (error) {
      console.error('Failed to load countries:', error);
    }
  };

  const handleBasicSearch = () => {
    // Check if this is a restaurant ID search
    if (restaurantId) {
      onSearch('restaurantId', {
        restaurantId: parseInt(restaurantId),
        limit: resultsPerPage,
      });
      return;
    }

    // Check if this is a search query (name, city, cuisine, country)
    if (restaurantName || city || cuisine || selectedCountry) {
      const queryFilters: any = {
        limit: resultsPerPage,
      };

      if (restaurantName) queryFilters.restaurantName = restaurantName;
      if (city) queryFilters.city = city;
      if (cuisine) queryFilters.cuisine = cuisine;
      if (selectedCountry) queryFilters.country = selectedCountry;

      onSearch('query', queryFilters);
      return;
    }

    // Otherwise, use the regular restaurant listing with cost filters
    const filters: any = {
      page: 1,
      limit: resultsPerPage,
    };

    if (minCost) filters.minCost = parseFloat(minCost);
    if (maxCost) filters.maxCost = parseFloat(maxCost);

    onSearch('basic', filters);
  };

  const handleLocationSearch = () => {
    if (!latitude || !longitude) return;
    
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseFloat(radius),
      limit: resultsPerPage,
    };

    onSearch('location', locationData);
  };

  const handleSemanticSearch = () => {
    if (!semanticQuery.trim()) return;
    
    onSearch('semantic', {
      query: semanticQuery,
      limit: resultsPerPage,
    });
  };

  const handleImageSearch = () => {
    if (!selectedFile || !imageSearchLat || !imageSearchLng) return;
    
    onSearch('image', {
      file: selectedFile,
      latitude: parseFloat(imageSearchLat),
      longitude: parseFloat(imageSearchLng),
      radius: parseFloat(imageSearchRadius),
      limit: resultsPerPage,
    });
  };

  const handleBrowseAll = () => {
    onBrowseAll(1, resultsPerPage);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearFilters = () => {
    setSelectedCountry('');
    setCity('');
    setCuisine('');
    setRestaurantName('');
    setRestaurantId('');
    setMinCost('');
    setMaxCost('');
    setLatitude('');
    setLongitude('');
    setRadius('5');
    setSemanticQuery('');
    setSelectedFile(null);
    setImageSearchLat('');
    setImageSearchLng('');
    setImageSearchRadius('3');
    onFiltersChange({});
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'browse', label: 'Browse All', icon: List },
          { id: 'basic', label: 'Basic Search', icon: Search },
          { id: 'location', label: 'Location', icon: MapPin },
          { id: 'semantic', label: 'Smart Search', icon: Zap },
          { id: 'image', label: 'Image Search', icon: Image },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Browse All Tab */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse All Restaurants</h3>
            <p className="text-gray-600 mb-6">
              Explore our complete restaurant database with full pagination support
            </p>
            <button
              onClick={handleBrowseAll}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <List size={20} />
              {loading ? 'Loading...' : 'Browse All Restaurants'}
            </button>
          </div>
        </div>
      )}

      {/* Basic Search Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
              <input
                type="text"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="e.g., Italian, Chinese"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Restaurant name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant ID</label>
              <input
                type="text"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                placeholder="Enter restaurant ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Cost</label>
                <input
                  type="number"
                  value={minCost}
                  onChange={(e) => setMinCost(e.target.value)}
                  placeholder="Min"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Cost</label>
                <input
                  type="number"
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                  placeholder="Max"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBasicSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Search size={18} />
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Filter size={18} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Location Search Tab */}
      {activeTab === 'location' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 40.7128"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -74.0060"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Radius (km)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <button
            onClick={handleLocationSearch}
            disabled={loading || !latitude || !longitude}
            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <MapPin size={18} />
            {loading ? 'Searching...' : 'Find Nearby'}
          </button>
        </div>
      )}

      {/* Semantic Search Tab */}
      {activeTab === 'semantic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Smart Search Query
            </label>
            <input
              type="text"
              value={semanticQuery}
              onChange={(e) => setSemanticQuery(e.target.value)}
              placeholder="e.g., 'romantic dinner for two', 'best pizza in town', 'vegetarian friendly'"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <p className="text-sm text-gray-500 mt-1">
              Use natural language to describe what you're looking for
            </p>
          </div>

          <button
            onClick={handleSemanticSearch}
            disabled={loading || !semanticQuery.trim()}
            className="flex items-center gap-2 bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Zap size={18} />
            {loading ? 'Searching...' : 'Smart Search'}
          </button>
        </div>
      )}

      {/* Image Search Tab */}
      {activeTab === 'image' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Food Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {selectedFile && (
              <p className="text-sm text-green-600 mt-1">Selected: {selectedFile.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Latitude</label>
              <input
                type="number"
                step="any"
                value={imageSearchLat}
                onChange={(e) => setImageSearchLat(e.target.value)}
                placeholder="e.g., 40.7128"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Longitude</label>
              <input
                type="number"
                step="any"
                value={imageSearchLng}
                onChange={(e) => setImageSearchLng(e.target.value)}
                placeholder="e.g., -74.0060"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Radius (km)</label>
              <input
                type="number"
                value={imageSearchRadius}
                onChange={(e) => setImageSearchRadius(e.target.value)}
                placeholder="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <button
            onClick={handleImageSearch}
            disabled={loading || !selectedFile || !imageSearchLat || !imageSearchLng}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Image size={18} />
            {loading ? 'Searching...' : 'Search by Image'}
          </button>
        </div>
      )}
    </div>
  );
};