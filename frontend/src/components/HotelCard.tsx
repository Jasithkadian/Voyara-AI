import React from 'react';
import { HotelRecommendation } from '../services/api';
import { Star, Hotel, ExternalLink, MapPin } from 'lucide-react';

interface HotelCardProps {
  hotel: HotelRecommendation;
  isBooked?: boolean;
  onBook?: () => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, isBooked, onBook }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow relative overflow-hidden group">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-cyan-400"></div>

      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="p-2.5 rounded-xl bg-brand/10 text-brand">
            <Hotel className="w-5 h-5" />
          </div>
          
          <div className="flex items-center space-x-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
            <span>{hotel.rating}</span>
          </div>
        </div>

        <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1 group-hover:text-brand transition-colors">
          {hotel.name}
        </h4>
        
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-neutral-400 mb-2 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{hotel.distanceFromCenter}</span>
        </div>

        <span className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md mb-3">
          {hotel.pricePerNight}
        </span>

        <p className="text-xs text-slate-500 dark:text-neutral-455 leading-relaxed mb-4">
          {hotel.description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-neutral-850 flex items-center justify-between">
        <span className="text-[10px] text-slate-450 dark:text-neutral-500 uppercase tracking-wider font-bold">Recommender Pick</span>
        {onBook ? (
          isBooked ? (
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/20">
              ✓ Booked
            </span>
          ) : (
            <button
              onClick={onBook}
              className="px-4 py-2 bg-brand hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition-all animate-fade-in"
            >
              Book Room
            </button>
          )
        ) : (
          <button
            onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + hotel.distanceFromCenter)}`, '_blank')}
            className="text-xs font-semibold text-brand hover:text-brand-600 flex items-center gap-1 group/btn"
          >
            Explore Deals <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
