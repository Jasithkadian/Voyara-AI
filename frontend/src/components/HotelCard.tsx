import React from 'react';
import { HotelRecommendation } from '../services/api';
import { Star, Hotel, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from './Badge';

interface HotelCardProps {
  hotel: HotelRecommendation;
  isBooked?: boolean;
  onBook?: () => void;
  index?: number;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, isBooked, onBook, index = 0 }) => {
  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-md p-comfortable shadow-lg flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99] relative overflow-hidden group">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-cyan-400"></div>

      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-sm bg-primary/10 text-primary">
            <Hotel className="w-5 h-5" />
          </div>
          
          <div className="flex items-center space-x-1 bg-warningAmber/10 text-warningAmber dark:text-warningAmber px-2 py-1 rounded-sm text-xs font-semibold font-mono">
            <Star className="w-3.5 h-3.5 fill-warningAmber stroke-warningAmber" />
            <span>{hotel.rating}</span>
          </div>
        </div>

        <h4 className="text-base font-semibold text-textPrimary dark:text-dark-text mb-1 group-hover:text-primary transition-colors">
          {hotel.name}
        </h4>
        
        <div className="flex items-center gap-1 text-xs text-textSecondary dark:text-dark-text-muted mb-2 font-normal">
          <MapPin className="w-4 h-4 text-textSecondary shrink-0" />
          <span className="truncate">{hotel.distanceFromCenter}</span>
        </div>

        <span className="inline-block text-xs font-semibold text-coral bg-coral/10 font-mono px-2 py-1 rounded-sm mb-4">
          {hotel.pricePerNight}
        </span>

        <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed mb-4">
          {hotel.description}
        </p>
      </div>

      <div className="pt-4 border-t border-stoneMuted/50 dark:border-dark-border flex items-center justify-between">
        <Badge 
          type={index === 0 ? "recommender" : index === 1 ? "value" : index === 2 ? "verified" : "duration"} 
          label={index === 0 ? "Recommender Pick" : index === 1 ? "Best Value" : index === 2 ? "Top Rated" : "Recommended"} 
        />
        {onBook ? (
          isBooked ? (
            <span className="text-xs bg-successSage/15 text-successSage font-semibold px-2 py-1 rounded-sm ">
              ✓ Booked
            </span>
          ) : (
            <button
              onClick={onBook}
              className="h-9 px-4 rounded-sm font-semibold text-xs bg-primary text-warmWhite hover:opacity-95 active:scale-[0.98] transition-all"
            >
              Book Room
            </button>
          )
        ) : (
          <button
            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + hotel.distanceFromCenter)}`, '_blank')}
            className="text-xs font-semibold text-primary hover:text-primary flex items-center gap-1 group/btn"
          >
            Explore Deals <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
