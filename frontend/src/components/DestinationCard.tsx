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
      <div className="destination-card skeleton"></div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="destination-card"
    >
      {/* Background Photo */}
      <img
        src={photo}
        alt={name}
        className="destination-card__image"
      />

      {/* Dark gradient overlay for text readability */}
      <div className="destination-card__overlay" />

      {/* Spinner for action loading */}
      {isLoadingAction && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs transition-opacity z-20">
          <div className="w-8 h-8 rounded-full border-2 border-stoneMuted/30 border-t-primary animate-spin" />
        </div>
      )}

      {/* Content */}
      <div className="destination-card__content">
        <div className="destination-card__region">
          {region}
        </div>
        <h3 className="destination-card__name">
          {name}
        </h3>
        <div className="destination-card__price">
          {displayPrice}
        </div>
      </div>
    </div>
  );
};

DestinationCard.displayName = 'DestinationCard';
