import React from 'react';
import { usePlacePhoto } from '../hooks/usePlacePhoto';

interface DestinationCardProps {
  name: string;
  region: string;
  price: string | number;
  description?: string;
  onClick?: () => void;
  isLoadingAction?: boolean;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
  name,
  region,
  price,
  onClick,
  isLoadingAction = false,
}) => {
  const { photo, loading } = usePlacePhoto(name, 'destination');

  const formattedPrice = typeof price === 'number' 
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)
    : price;

  const displayPrice = formattedPrice.startsWith('from') ? formattedPrice : `from ${formattedPrice}`;

  if (loading) {
    return (
      <div className="w-[280px] h-[340px] rounded-[12px] bg-stoneMuted dark:bg-dark-muted animate-pulse flex flex-col justify-end p-comfortable border border-stoneMuted dark:border-dark-border/40">
        <div className="space-y-3">
          <div className="h-3 bg-warmWhite/20 rounded w-1/3 animate-pulse"></div>
          <div className="h-6 bg-warmWhite/20 rounded w-2/3 animate-pulse"></div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-4 bg-warmWhite/20 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="w-[280px] h-[340px] rounded-[12px] relative overflow-hidden flex flex-col justify-end p-comfortable cursor-pointer select-none group shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-stoneMuted/40 dark:border-dark-border/30"
    >
      {/* Background Photo */}
      <img
        src={photo}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

      {/* Spinner for action loading */}
      {isLoadingAction && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs transition-opacity">
          <div className="w-8 h-8 rounded-full border-2 border-stoneMuted/30 border-t-primary animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full flex justify-between items-end gap-2 pointer-events-none">
        <div className="flex flex-col text-left">
          {/* Region Label */}
          <span className="text-[10px] text-warmWhite/75 font-bold tracking-wider uppercase mb-0.5">
            {region}
          </span>
          {/* Destination Name */}
          <h3 className="destination-name text-warmWhite leading-tight tracking-tight">
            {name}
          </h3>
        </div>

        {/* Price Indicator */}
        <span className="price text-[var(--color-accent)] bg-black/40 backdrop-blur-xs border border-[var(--color-accent)]/30 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
          {displayPrice}
        </span>
      </div>
    </div>
  );
};
