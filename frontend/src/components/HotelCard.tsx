import React from 'react';
import { Star, Wifi, Wind, Waves, Coffee, ExternalLink, Lock, UtensilsCrossed, Users } from 'lucide-react';
import { usePlacePhoto } from '../hooks/usePlacePhoto';
import { AccommodationType } from '../types';

export interface HotelRecommendation {
  name: string;
  rating: string;
  pricePerNight: string;
  distanceFromCenter: string;
  description: string;
}

interface HotelCardProps {
  hotel: HotelRecommendation;
  isBooked?: boolean;
  onBook?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  index?: number;
  isBestValue?: boolean;
  accommodationType?: AccommodationType;
  tierLabel?: string;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  isBooked = false,
  onBook,
  onSelect,
  isSelected = false,
  index = 0,
  isBestValue = index === 1,
  accommodationType = 'budget-hotel',
  tierLabel = '',
}) => {
  const { photo, loading } = usePlacePhoto(hotel.name, 'hotel');

  // Derive if recommended (first item in recommendation)
  const isRecommended = index === 0;

  // Generate realistic reviews count
  const reviewCount = Math.floor((hotel.name.length * 7) % 250) + 45;

  if (loading) {
    return (
      <div className="hotel-card p-4 flex gap-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
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

  // Determine colors based on accommodationType or tierLabel
  let labelColor = '#3b82f6'; // default blue
  let labelBg = '#3b82f61a';
  let labelBorder = '#3b82f633';
  let computedLabel = tierLabel;

  if (accommodationType === 'hostel-dorm') {
    labelColor = '#10b981'; // green
    labelBg = '#10b9811a';
    labelBorder = '#10b98133';
    if (!computedLabel) computedLabel = 'Backpacker Pick';
  } else if (accommodationType === 'guesthouse') {
    labelColor = '#3b82f6'; // blue
    labelBg = '#3b82f61a';
    labelBorder = '#3b82f633';
    if (!computedLabel) computedLabel = 'Budget Pick';
  } else if (accommodationType === 'budget-hotel') {
    labelColor = '#f59e0b'; // amber
    labelBg = '#f59e0b1a';
    labelBorder = '#f59e0b33';
    if (!computedLabel) computedLabel = 'Best Value';
  } else if (accommodationType === 'mid-hotel') {
    labelColor = '#f59e0b'; // amber
    labelBg = '#f59e0b1a';
    labelBorder = '#f59e0b33';
    if (!computedLabel) computedLabel = 'Best Value';
  } else if (accommodationType === 'luxury-hotel') {
    labelColor = '#f43f5e'; // coral
    labelBg = '#f43f5e1a';
    labelBorder = '#f43f5e33';
    if (!computedLabel) computedLabel = 'Premium Pick';
  }

  // Parse price number
  const parsedPrice = parseInt(String(hotel.pricePerNight).replace(/[^0-9]/g, '')) || 1200;

  return (
    <div className={`hotel-card card-interactive cursor-pointer border rounded-2xl overflow-hidden bg-[var(--color-bg-card)] ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-[var(--color-border)]'}`}>
      {/* Photo */}
      <div className="hotel-card__image-wrapper relative h-48 w-full overflow-hidden">
        <img
          src={photo}
          alt={hotel.name}
          className="hotel-card__image w-full h-full object-cover"
        />
        {/* Tier Pick Label */}
        {computedLabel && (
          <span
            className="absolute top-3 left-3 text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border shadow-md font-sans"
            style={{
              color: labelColor,
              backgroundColor: labelBg,
              borderColor: labelBorder,
            }}
          >
            {computedLabel}
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="hotel-card__body p-5 space-y-4">
        <div className="hotel-card__header flex justify-between items-start">
          <h4 className="hotel-card__name font-bold text-base text-[var(--color-text-primary)] leading-tight line-clamp-1">
            {hotel.name}
          </h4>
          {/* Fallback badges */}
          {!computedLabel && isBestValue && (
            <span className="hotel-card__badge hotel-card__badge--best-value text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ml-2 bg-amber-500/10 text-amber-400 shrink-0">
              BEST VALUE
            </span>
          )}
          {!computedLabel && isRecommended && !isBestValue && (
            <span className="hotel-card__badge hotel-card__badge--our-pick text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ml-2 bg-purple-500/10 text-purple-400 shrink-0">
              OUR PICK
            </span>
          )}
        </div>

        {/* Rating or Dorm Label */}
        {accommodationType === 'hostel-dorm' ? (
          <div className="text-xs font-bold text-emerald-400 font-sans flex items-center gap-1.5">
            <span>🏢 4-bed dorm available</span>
          </div>
        ) : (
          <div className="hotel-card__rating flex items-center text-xs font-semibold text-[var(--color-text-primary)]">
            <Star className="w-3.5 h-3.5 star text-amber-400 mr-1 fill-current" />
            <span>{hotel.rating || '4.2'}</span>
            <span className="text-[var(--color-text-muted)] font-sans ml-1 font-normal">
              ({reviewCount} reviews)
            </span>
          </div>
        )}

        {/* Location */}
        <div className="hotel-card__location text-xs text-[var(--color-text-secondary)] font-medium flex items-center gap-1">
          <span>📍 {hotel.distanceFromCenter || '1.2 km from center'}</span>
        </div>

        {/* Amenities Row */}
        {accommodationType === 'hostel-dorm' ? (
          <div className="hotel-card__amenities flex flex-wrap gap-2 text-[10px] font-bold text-[var(--color-text-muted)] pt-1">
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Free High-speed WiFi">
              <Wifi size={12} className="text-emerald-400" /> WiFi
            </div>
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Personal Lockers">
              <Lock size={12} className="text-emerald-400" /> Lockers
            </div>
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Common Kitchen">
              <UtensilsCrossed size={12} className="text-emerald-400" /> Kitchen
            </div>
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Social Events">
              <Users size={12} className="text-emerald-400" /> Social
            </div>
          </div>
        ) : (
          <div className="hotel-card__amenities flex flex-wrap gap-2 text-[10px] font-bold text-[var(--color-text-muted)] pt-1">
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="High-speed WiFi">
              <Wifi size={12} className="text-blue-400" /> WiFi
            </div>
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Air Conditioning">
              <Wind size={12} className="text-blue-400" /> AC
            </div>
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Swimming Pool">
              <Waves size={12} className="text-blue-400" /> Pool
            </div>
            <div className="hotel-card__amenity flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Breakfast Included">
              <Coffee size={12} className="text-blue-400" /> Breakfast
            </div>
          </div>
        )}

        {/* Price & Cancellation */}
        <div className="hotel-card__price flex flex-col justify-end pt-2 border-t border-[var(--color-border-subtle)]">
          <div className="hotel-card__price-night font-bold text-lg text-[var(--color-text-primary)] font-mono leading-none">
            {hotel.pricePerNight}
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] font-sans ml-1 uppercase">
              {accommodationType === 'hostel-dorm' ? '/ bed / night' : '/ night'}
            </span>
          </div>
          <div className="hotel-card__price-total text-[10px] text-[var(--color-text-muted)] font-semibold mt-1 uppercase">
            ₹{(parsedPrice * 5).toLocaleString('en-IN')} total (5 days)
          </div>
        </div>

        <div className="hotel-card__cancellation text-[10px] font-bold text-emerald-400 uppercase tracking-wide">
          Free cancellation until Jul 23
        </div>

        {/* Action Buttons */}
        <div className="hotel-card__cta flex gap-2 pt-2">
          {isBooked ? (
            <button className="btn-secondary w-full text-xs font-bold uppercase tracking-wider py-2" disabled>
              ✓ Booked
            </button>
          ) : (
            <>
              {isRecommended ? (
                <button
                  onClick={onBook}
                  className="btn-primary flex-1 text-xs py-2 px-1 font-bold uppercase tracking-wider"
                >
                  Book Stay
                </button>
              ) : (
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' deals')}`,
                      '_blank'
                    )
                  }
                  className="btn-secondary flex-1 text-xs py-2 px-1 flex items-center justify-center gap-1 font-bold uppercase tracking-wider"
                >
                  <span>Deals</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
                className={`text-xs py-2 px-3 rounded-lg border font-bold transition-all flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                    : 'border-white/10 text-stone-400 bg-white/5 hover:bg-white/10 hover:text-white'
                }`}
                title="Select this Hotel"
              >
                {isSelected ? '★ Selected' : '☆ Select'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

HotelCard.displayName = 'HotelCard';
