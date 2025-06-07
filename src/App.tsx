import React, { useEffect } from 'react';
import { Search, MapPin, Utensils, AlertCircle } from 'lucide-react';
import { SearchFilters } from './components/SearchFilters';
import { RestaurantCard } from './components/RestaurantCard';
import { Pagination } from './components/Pagination';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useRestaurants } from './hooks/useRestaurants';

function App() {
  const {
    restaurants,
    loading,
    error,
    totalResults,
    currentPage,
    resultsPerPage,
    lastSearchType,
    searchRestaurants,
    searchByQuery,
    searchNearby,
    semanticSearch,
    imageSearch,
    browseAllRestaurants,
    setPage,
    setPageSize,
  } = useRestaurants();

  // Load initial restaurants on mount
  useEffect(() => {
    browseAllRestaurants(1, 20);
  }, [browseAllRestaurants]);

  const handleSearch = async (type: string, data: any) => {
    switch (type) {
      case 'basic':
        if (data.restaurantId) {
          // Search by restaurant ID using the search endpoint
          await searchByQuery({ restaurantId: data.restaurantId, limit: data.limit || 20 });
        } else {
          // Use regular restaurant listing with filters
          await searchRestaurants(data);
        }
        break;
      case 'location':
        await searchNearby(data);
        break;
      case 'semantic':
        await semanticSearch(data);
        break;
      case 'image':
        await imageSearch(data.file, data.latitude, data.longitude, data.radius);
        break;
      default:
        await searchByQuery(data);
    }
  };

  const handleBrowseAll = async (page: number = 1, limit: number = 20) => {
    await browseAllRestaurants(page, limit);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize);
  };

  const isSemanticResults = restaurants.length > 0 && 'similarity' in restaurants[0];
  const supportsPagination = lastSearchType === 'basic' || lastSearchType === 'browse';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Utensils className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TastyFind
                </h1>
                <p className="text-gray-600 text-sm">Discover amazing restaurants worldwide</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Search size={16} />
                <span>Smart Search</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>Location Based</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters */}
        <SearchFilters
          onFiltersChange={() => {}}
          onSearch={handleSearch}
          onBrowseAll={handleBrowseAll}
          loading={loading}
          resultsPerPage={resultsPerPage}
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-center gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0\" size={20} />
            <div>
              <h3 className="font-medium text-red-800">Search Error</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingSpinner size="lg" text="Searching for restaurants..." />
        )}

        {/* Results */}
        {!loading && restaurants.length > 0 && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isSemanticResults ? 'Smart Search Results' : 
                   lastSearchType === 'browse' ? 'All Restaurants' : 'Restaurant Results'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {supportsPagination ? (
                    <>Showing {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} (Page {currentPage})</>
                  ) : (
                    <>Found {totalResults} restaurant{totalResults !== 1 ? 's' : ''}</>
                  )}
                  {isSemanticResults && ' ranked by relevance'}
                </p>
              </div>
            </div>

            {/* Restaurant Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  showSimilarity={isSemanticResults}
                />
              ))}
            </div>

            {/* Pagination - Show for basic search and browse all */}
            {supportsPagination && restaurants.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalResults={1000000} // Large number to enable pagination (backend doesn't return total count)
                resultsPerPage={resultsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                loading={loading}
              />
            )}

            {/* Results info for non-paginated searches */}
            {!supportsPagination && restaurants.length > 0 && (
              <div className="text-center py-4">
                <p className="text-gray-600">
                  Showing {restaurants.length} result{restaurants.length !== 1 ? 's' : ''}
                  {isSemanticResults && ' ranked by relevance'}
                </p>
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {!loading && restaurants.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="text-gray-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or explore different locations and cuisines.
              </p>
              <button
                onClick={() => browseAllRestaurants(1, 20)}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Browse All Restaurants
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold">TastyFind</h3>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover the perfect dining experience with our advanced restaurant search platform. 
              Find restaurants by cuisine, location, price range, and even upload food images to find similar dishes nearby.
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2025 TastyFind. Built with modern web technologies for the best restaurant discovery experience.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;