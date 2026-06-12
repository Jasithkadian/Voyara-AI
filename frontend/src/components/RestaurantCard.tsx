import React from 'react';
import { usePlacePhoto } from '../hooks/usePlacePhoto';
import { Star, MapPin, Banknote, CheckCircle, CalendarClock, Shirt } from 'lucide-react';
import { DiningType } from '../types';

interface RestaurantCardProps {
  name: string;
  description: string;
  meal: string; // e.g. "Lunch", "Dinner"
  cuisine?: string;
  cost?: number | string;
  rating?: string | number;
  diningTier?: DiningType;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = React.memo(({
  name,
  description,
  meal,
  cuisine = 'Local',
  cost = 0,
  rating = '4.5',
  diningTier = 'mid-range',
}) => {
  const { photo, loading } = usePlacePhoto(name, 'food');

  const formatCurrency = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (val === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getMealBadgeColor = (mealStr: string) => {
    const m = mealStr.toLowerCase();
    if (m.includes('lunch')) return 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]/50';
    if (m.includes('dinner')) return 'bg-[#1E1B4B] text-[#A5B4FC] border-[#312E81]/50';
    return 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]';
  };

  // Classify layouts
  const isStreetFood = diningTier === 'street-food';
  const isDhaba = diningTier === 'dhaba';
  const isLocal = diningTier === 'local-restaurant';
  const isMid = diningTier === 'mid-range';
  const isFine = diningTier === 'fine-dining';

  return (
    <div className={`card-base restaurant-card card-interactive cursor-pointer border rounded-2xl overflow-hidden bg-[var(--color-bg-card)] ${isFine ? 'border-purple-500/30 shadow-lg shadow-purple-500/5' : 'border-[var(--color-border)]'}`}>
      <div className="w-full h-[120px] relative overflow-hidden bg-[var(--color-bg-hover)]">
        {loading ? (
          <div className="w-full h-full skeleton" />
        ) : (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        )}
      </div>

      <div className="p-4 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getMealBadgeColor(meal)}`}>
              {meal}
            </span>

            {/* Dining Tier Badges */}
            {isStreetFood && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                Street Food
              </span>
            )}
            {isDhaba && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                Dhaba
              </span>
            )}
            {isLocal && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">
                Local Restaurant
              </span>
            )}
            {isFine && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400 font-sans">
                Fine Dining
              </span>
            )}
          </div>
          
          <h4 className="text-base font-bold text-[var(--color-text-primary)] leading-snug truncate mb-0.5">
            {name}
          </h4>
          
          <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2.5">
            {cuisine}
          </div>
          
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>

          {/* Indicators Row */}
          {(isStreetFood || isDhaba) && (
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-emerald-400/90 pt-1">
              <span className="flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                <Banknote size={11} /> Cash Only
              </span>
              <span className="flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                <CheckCircle size={11} /> No Booking
              </span>
              {isDhaba && (
                <span className="flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                  🍃 Veg Options
                </span>
              )}
            </div>
          )}

          {isLocal && (
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-blue-400/90 pt-1">
              <span className="flex items-center gap-1 bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/10">
                <CheckCircle size={11} /> Walk-in Welcome
              </span>
            </div>
          )}

          {isFine && (
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-purple-400/90 pt-1">
              <span className="flex items-center gap-1 bg-purple-500/5 px-2 py-0.5 rounded-md border border-purple-500/10">
                <CalendarClock size={11} /> Reserve Required
              </span>
              <span className="flex items-center gap-1 bg-purple-500/5 px-2 py-0.5 rounded-md border border-purple-500/10">
                <Shirt size={11} /> Smart Casual
              </span>
            </div>
          )}
        </div>

        {/* Card Footer Details */}
        <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)]">
              <MapPin className="w-3.5 h-3.5" /> Area
            </span>
            {/* Hostels/Street Food usually don't rely heavily on star ratings, but standard is fine unless street food */}
            {!isStreetFood && !isDhaba && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-primary)] font-mono">
                <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current" /> {rating}
              </span>
            )}
          </div>
          
          <div className="text-right">
            <span className="text-[8px] uppercase font-bold text-[var(--color-text-muted)] block leading-none mb-0.5">Meal Est.</span>
            <span className="price text-[var(--color-text-primary)] text-sm font-bold font-mono leading-none">
              {formatCurrency(cost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

RestaurantCard.displayName = 'RestaurantCard';
