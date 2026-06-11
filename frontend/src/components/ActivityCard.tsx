import React from 'react';
import { usePlacePhoto } from '../hooks/usePlacePhoto';
import { Star, Clock, MapPin, Compass } from 'lucide-react';

export type ActivityCardVariant = 'destination' | 'activity' | 'data';

interface ActivityCardProps {
  name: string;
  description: string;
  time: string; // e.g. "Morning", "Afternoon", "Evening" or direct hours like "09:00 AM"
  duration?: string;
  location?: string;
  cost?: number | string;
  rating?: string | number;
  variant?: ActivityCardVariant;
  onClick?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  name,
  description,
  time,
  duration = '2 hours',
  location,
  cost = 0,
  rating,
  variant = 'activity',
  onClick,
}) => {
  const { photo, loading } = usePlacePhoto(name, 'activity');

  const formatCurrency = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (val === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Determine left border color for "data" variant
  const getBorderColorClass = (timeString: string) => {
    const t = timeString.toLowerCase();
    if (t.includes('morning')) return 'border-l-warningAmber'; // amber
    if (t.includes('afternoon')) return 'border-l-teal-500 dark:border-l-teal-400'; // teal
    return 'border-l-[#1A1A2E] dark:border-l-primary'; // navy / primary
  };

  // Determine badge background color for "activity" variant
  const getTimeBadgeColor = (timeString: string) => {
    const t = timeString.toLowerCase();
    if (t.includes('morning')) return 'bg-warningAmber/10 text-warningAmber border-warningAmber/20';
    if (t.includes('afternoon')) return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  // 1. DESTINATION VARIANT (Full Photography)
  if (variant === 'destination') {
    return (
      <div
        onClick={onClick}
        className="relative w-full h-[180px] rounded-lg overflow-hidden flex flex-col justify-end p-comfortable cursor-pointer select-none group border border-stoneMuted/40 dark:border-dark-border/30 shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all"
      >
        {loading ? (
          <div className="absolute inset-0 bg-stoneMuted dark:bg-dark-muted animate-pulse" />
        ) : (
          <img
            src={photo}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-750"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1 text-left">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold text-warmWhite bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-[4px] border border-warmWhite/20 uppercase tracking-wider">
              {time}
            </span>
            {rating && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-warningAmber bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-[4px] border border-warningAmber/20">
                <Star className="w-2.5 h-2.5 fill-warningAmber stroke-warningAmber" />
                {rating}
              </span>
            )}
          </div>
          <h4 className="font-sans text-[16px] font-bold text-warmWhite tracking-tight">
            {name}
          </h4>
          <p className="text-[12px] text-warmWhite/75 line-clamp-2 leading-relaxed font-normal">
            {description}
          </p>
          <div className="flex justify-between items-center pt-2 text-[11px] text-warmWhite/80 font-mono border-t border-warmWhite/20 mt-2">
            <span>{duration}</span>
            <span className="text-coral font-bold">{formatCurrency(cost)}</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVITY VARIANT (Left-aligned 80px photo strip)
  if (variant === 'activity') {
    return (
      <div
        onClick={onClick}
        className="flex flex-row items-stretch bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-lg overflow-hidden min-h-[130px] shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group"
      >
        {/* Photo Strip */}
        <div className="w-[80px] shrink-0 relative bg-stoneMuted dark:bg-dark-muted overflow-hidden">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-stoneMuted dark:bg-dark-muted" />
          ) : (
            <img
              src={photo}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-comfortable flex flex-col justify-between min-w-0 text-left">
          <div>
            <div className="flex justify-between items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border ${getTimeBadgeColor(time)}`}>
                {time}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-textSecondary dark:text-dark-text-muted">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 shrink-0" /> {duration}
                </span>
                {rating && (
                  <span className="flex items-center gap-0.5 font-semibold text-warningAmber">
                    <Star className="w-3 h-3 fill-warningAmber stroke-warningAmber" />
                    {rating}
                  </span>
                )}
              </div>
            </div>

            <h4 className="text-[16px] font-bold text-textPrimary dark:text-dark-text group-hover:text-primary transition-colors leading-snug">
              {name}
            </h4>
            <p className="text-[14px] font-normal text-textSecondary dark:text-dark-text-muted mt-1 leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>

          <div className="flex justify-between items-center border-t border-stoneMuted/40 dark:border-dark-border/40 pt-2.5 mt-2 gap-4">
            {location ? (
              <span className="flex items-center gap-1 text-[11px] text-textSecondary dark:text-dark-text-muted truncate">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                {location}
              </span>
            ) : (
              <span />
            )}
            <span className="font-mono text-xs font-semibold text-coral whitespace-nowrap shrink-0">
              {formatCurrency(cost)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. DATA VARIANT (No photography, white background, left-border color indicator)
  return (
    <div
      onClick={onClick}
      className={`flex flex-col justify-between bg-warmWhite dark:bg-dark-card border-y border-r border-l-[6px] ${getBorderColorClass(
        time
      )} border-y-stoneMuted/60 border-r-stoneMuted/60 dark:border-y-dark-border/60 dark:border-r-dark-border/60 rounded-lg p-comfortable min-h-[110px] shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all cursor-pointer group text-left`}
    >
      <div>
        <div className="flex justify-between items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold text-textSecondary dark:text-dark-text-muted uppercase tracking-wider">
            {time}
          </span>
          <div className="flex items-center gap-3 text-[11px] text-textSecondary dark:text-dark-text-muted font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 shrink-0" /> {duration}
            </span>
            {rating && (
              <span className="flex items-center gap-0.5 text-warningAmber font-semibold">
                <Star className="w-3 h-3 fill-warningAmber stroke-warningAmber" />
                {rating}
              </span>
            )}
          </div>
        </div>

        <h4 className="text-[16px] font-bold text-textPrimary dark:text-dark-text group-hover:text-primary transition-colors leading-snug">
          {name}
        </h4>
        <p className="text-[14px] font-normal text-textSecondary dark:text-dark-text-muted mt-1 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className="flex justify-between items-center border-t border-stoneMuted/40 dark:border-dark-border/40 pt-2.5 mt-2.5 gap-4">
        {location ? (
          <span className="flex items-center gap-1 text-[11px] text-textSecondary dark:text-dark-text-muted truncate">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            {location}
          </span>
        ) : (
          <span />
        )}
        <span className="font-mono text-xs font-semibold text-coral whitespace-nowrap shrink-0">
          {formatCurrency(cost)}
        </span>
      </div>
    </div>
  );
};
