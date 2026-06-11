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

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-[12px] flex flex-row items-stretch h-[180px] shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.995] transition-all relative overflow-hidden group">
      
      {/* Top Accent bar for recommended */}
      {isRecommended && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-cyan-400 z-20"></div>
      )}

      {/* Left Photo Strip */}
      <div className="w-[120px] shrink-0 relative overflow-hidden bg-stoneMuted dark:bg-dark-muted">
        {loading ? (
          <div className="w-full h-full animate-pulse bg-stoneMuted dark:bg-dark-muted" />
        ) : (
          <img
            src={photo}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )}
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col justify-between p-comfortable min-w-0">
        <div>
          {/* Top Line: Title & Badges */}
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-[16px] font-bold text-textPrimary dark:text-dark-text leading-snug truncate group-hover:text-primary transition-colors">
              {hotel.name}
            </h4>
            {isBestValue && (
              <span className="shrink-0 bg-coral/15 text-coral border border-coral/20 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider">
                Best Value
              </span>
            )}
            {isRecommended && !isBestValue && (
              <span className="shrink-0 bg-primary/10 text-primary border border-primary/10 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold uppercase tracking-wider">
                Our Pick
              </span>
            )}
          </div>

          {/* Second Line: Star Rating & Review Count */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-warningAmber">
              {[...Array(5)].map((_, i) => {
                const isFilled = i < Math.floor(Number(hotel.rating || 4));
                return (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      isFilled ? 'fill-warningAmber stroke-warningAmber' : 'text-stoneMuted dark:text-dark-border'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] font-semibold text-warningAmber font-mono">
              {hotel.rating || '4.2'}
            </span>
            <span className="text-[11px] text-textSecondary dark:text-dark-text-muted">
              ({reviewCount} reviews)
            </span>
          </div>

          {/* Third Line: Amenity Icons */}
          <div className="flex gap-2.5 mt-2.5">
            <div title="High-speed WiFi" className="p-1 bg-stoneMuted/30 dark:bg-dark-muted/40 rounded-md text-textSecondary dark:text-dark-text-muted hover:text-primary transition-colors">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <div title="Air Conditioning" className="p-1 bg-stoneMuted/30 dark:bg-dark-muted/40 rounded-md text-textSecondary dark:text-dark-text-muted hover:text-primary transition-colors">
              <Wind className="w-3.5 h-3.5" />
            </div>
            <div title="Swimming Pool" className="p-1 bg-stoneMuted/30 dark:bg-dark-muted/40 rounded-md text-textSecondary dark:text-dark-text-muted hover:text-primary transition-colors">
              <Waves className="w-3.5 h-3.5" />
            </div>
            <div title="Breakfast Included" className="p-1 bg-stoneMuted/30 dark:bg-dark-muted/40 rounded-md text-textSecondary dark:text-dark-text-muted hover:text-primary transition-colors">
              <Coffee className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Bottom Line: Price & Booking Action */}
        <div className="flex justify-between items-center pt-2 border-t border-stoneMuted/40 dark:border-dark-border/40 gap-4 mt-auto">
          {/* Price (Coral Accent) */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-textSecondary dark:text-dark-text-muted font-semibold tracking-wider">
              Price
            </span>
            <span className="text-[15px] font-bold text-coral font-mono leading-none mt-0.5">
              {hotel.pricePerNight}
            </span>
          </div>

          {/* Action button */}
          {isRecommended ? (
            isBooked ? (
              <span className="h-8 px-3 rounded-md font-semibold text-[11px] bg-successSage/15 text-successSage border border-successSage/20 flex items-center justify-center">
                ✓ Booked
              </span>
            ) : (
              <button
                onClick={onBook}
                className="h-8 px-3.5 rounded-md font-semibold text-[11px] bg-primary text-warmWhite hover:bg-primary/90 active:scale-[0.97] transition-all whitespace-nowrap"
              >
                Book Room
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
              className="h-8 px-3 rounded-md border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-dark-text-muted hover:bg-stoneMuted/30 dark:hover:bg-dark-muted font-semibold text-[11px] flex items-center gap-1 transition-all whitespace-nowrap"
            >
              <span>View Hotel</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
