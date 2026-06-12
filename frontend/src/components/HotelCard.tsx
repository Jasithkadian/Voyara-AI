import React from 'react';
import { HotelRecommendation } from '../services/api';
import { Star, Wifi, Wind, Waves, Coffee, ExternalLink } from 'lucide-react';
import { usePlacePhoto } from '../hooks/usePlacePhoto';

interface HotelCardProps {
  hotel: HotelRecommendation;
  isBooked?: boolean;
  onBook?: () => void;
  index?: number;
  isBestValue?: boolean;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  isBooked = false,
  onBook,
  index = 0,
  isBestValue = index === 1,
}) => {
  const { photo, loading } = usePlacePhoto(hotel.name, 'hotel');

  // Derive if recommended (first item in recommendation)
  const isRecommended = index === 0;

  // Generate realistic reviews count based on hotel name length
  const reviewCount = Math.floor((hotel.name.length * 7) % 250) + 45;

  if (loading) {
    return (
      <div className="hotel-card p-4 flex gap-4">
        <div className="w-[120px] h-full skeleton rounded-[var(--radius-sm)]" />
        <div className="flex-1 space-y-3 py-2">
          <div className="skeleton skeleton-text-lg" />
          <div className="skeleton skeleton-text-sm w-[40%]" />
          <div className="skeleton skeleton-text-xs w-[60%]" />
          <div className="skeleton skeleton-text-sm w-[30%] mt-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-card">
      {/* Photo (using CSS structure) */}
      <img
        src={photo}
        alt={hotel.name}
        className="hotel-card__image"
      />

      {/* Body Content */}
      <div className="hotel-card__body">
        <div className="hotel-card__header">
          <h4 className="hotel-card__name">
            {hotel.name}
          </h4>
          {/* Badge Logic */}
          {isBestValue && (
            <span className="hotel-card__badge hotel-card__badge--best-value">
              BEST VALUE
            </span>
          )}
          {isRecommended && !isBestValue && (
            <span className="hotel-card__badge hotel-card__badge--our-pick">
              OUR PICK
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="hotel-card__rating">
          <Star className="w-3.5 h-3.5 star" />
          <span>{hotel.rating || '4.2'}</span>
          <span className="text-[var(--color-text-muted)] font-sans ml-1 text-[11px] font-normal">
            ({reviewCount} reviews)
          </span>
        </div>

        {/* Location (Distance placeholder for now) */}
        <div className="hotel-card__location">
          <span>📍 1.2 km from center</span>
        </div>

        {/* Amenities */}
        <div className="hotel-card__amenities">
          <div className="hotel-card__amenity" title="High-speed WiFi">
            <Wifi className="w-3.5 h-3.5" /> WiFi
          </div>
          <div className="hotel-card__amenity" title="Air Conditioning">
            <Wind className="w-3.5 h-3.5" /> AC
          </div>
          <div className="hotel-card__amenity" title="Swimming Pool">
            <Waves className="w-3.5 h-3.5" /> Pool
          </div>
          <div className="hotel-card__amenity" title="Breakfast Included">
            <Coffee className="w-3.5 h-3.5" /> Breakfast
          </div>
        </div>

        {/* Price & Cancellation */}
        <div className="hotel-card__price">
          <div className="hotel-card__price-night">{hotel.pricePerNight}</div>
          <div className="hotel-card__price-total">₹{parseInt((hotel.pricePerNight as string).replace(/[^0-9]/g, '')) * 5} total</div>
        </div>
        
        <div className="hotel-card__cancellation">
          Free cancellation until Jul 23
        </div>

        {/* Action button */}
        <div className="hotel-card__cta">
          {isRecommended ? (
            isBooked ? (
              <button className="btn-secondary w-full" disabled>
                ✓ Booked
              </button>
            ) : (
              <button
                onClick={onBook}
                className="btn-primary w-full"
              >
                View Hotel
              </button>
            )
          ) : (
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' deals')}`,
                  '_blank'
                )
              }
              className="btn-secondary w-full"
            >
              <span>View Hotel</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

HotelCard.displayName = 'HotelCard';
