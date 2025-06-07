import React from 'react';
import { MapPin, Star, Clock, CreditCard, Utensils } from 'lucide-react';
import { Restaurant, RestaurantWithSimilarity } from '../types/restaurant';

interface RestaurantCardProps {
  restaurant: Restaurant | RestaurantWithSimilarity;
  showSimilarity?: boolean;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, showSimilarity = false }) => {
  const hasOnlineDelivery = restaurant.has_online_delivery === 'Yes';
  const hasTableBooking = restaurant.has_table_booking === 'Yes';
  const isDelivering = restaurant.is_delivering_now === 'Yes';

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'text-green-600 bg-green-100';
    if (rating >= 3.0) return 'text-yellow-600 bg-yellow-100';
    if (rating >= 2.0) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriceRangeDisplay = (range: number) => {
    return '₹'.repeat(range) + '₹'.repeat(4 - range).split('').map(() => '').join('○');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {restaurant.restaurant_name}
            </h3>
            <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
              <MapPin size={14} />
              {restaurant.locality}, {restaurant.city}
            </p>
          </div>
          
          {restaurant.aggregate_rating > 0 && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(restaurant.aggregate_rating)}`}>
              <Star size={14} fill="currentColor" />
              {restaurant.aggregate_rating.toFixed(1)}
            </div>
          )}
        </div>

        {showSimilarity && 'similarity' in restaurant && (
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Match:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${restaurant.similarity * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {(restaurant.similarity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {restaurant.cuisines && restaurant.cuisines.split(',').slice(0, 3).map((cuisine, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
            >
              {cuisine.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <CreditCard size={16} />
            <div>
              <p className="text-sm">Cost for 2</p>
              <p className="font-semibold text-gray-900">
                {restaurant.currency} {restaurant.average_cost_for_two}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Utensils size={16} />
            <div>
              <p className="text-sm">Price Range</p>
              <p className="font-semibold text-gray-900">
                {getPriceRangeDisplay(restaurant.price_range)}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {hasOnlineDelivery && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
              <Clock size={12} />
              Online Delivery
            </span>
          )}
          {hasTableBooking && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
              Table Booking
            </span>
          )}
          {isDelivering && (
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
              Delivering Now
            </span>
          )}
        </div>

        {/* Address */}
        <div className="text-gray-600 text-sm">
          <p className="line-clamp-2">{restaurant.address}</p>
          <p className="mt-1 font-medium">{restaurant.country}</p>
        </div>

        {/* Rating Details */}
        {restaurant.votes > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>{restaurant.rating_text}</span>
              <span>{restaurant.votes} votes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};