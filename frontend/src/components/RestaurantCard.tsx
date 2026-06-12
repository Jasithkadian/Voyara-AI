import React from 'react';
import { usePlacePhoto } from '../hooks/usePlacePhoto';
import { Star, MapPin } from 'lucide-react';

interface RestaurantCardProps {
  name: string;
  description: string;
  meal: string; // e.g. "Lunch", "Dinner"
  cuisine?: string;
  cost?: number | string;
  rating?: string | number;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = React.memo(({
  name,
  description,
  meal,
  cuisine = 'Local',
  cost = 0,
  rating = '4.5',
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
    if (m.includes('lunch')) return 'bg-[#FFF7ED] text-[#C2410C]';
    if (m.includes('dinner')) return 'bg-[#1E1B4B] text-[#A5B4FC]';
    return 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]';
  };

  return (
    <div className="card-base restaurant-card card-interactive cursor-pointer">
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

      <div className="p-4 flex flex-col justify-between">
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-xs)] mb-3 inline-block ${getMealBadgeColor(meal)}`}>
            {meal}
          </span>
          
          <h4 className="text-[16px] font-bold text-[var(--color-text-primary)] leading-snug truncate mb-1">
            {name}
          </h4>
          
          <div className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
            {cuisine}
          </div>
          
          <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 mb-4">
            {description}
          </p>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-muted)]">
              <MapPin className="w-3.5 h-3.5" /> Location
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-primary)] font-mono">
              <Star className="w-3.5 h-3.5 text-[#F59E0B]" /> {rating}
            </span>
          </div>
          
          <span className="price text-[var(--color-text-primary)] text-sm">
            {formatCurrency(cost)}
          </span>
        </div>
      </div>
    </div>
  );
});

RestaurantCard.displayName = 'RestaurantCard';
