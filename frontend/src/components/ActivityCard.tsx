import React from 'react';
import { usePlacePhoto } from '../hooks/usePlacePhoto';
import { Clock, MapPin } from 'lucide-react';

interface ActivityCardProps {
  name: string;
  description: string;
  time: string; // e.g. "Morning", "Afternoon", "Evening" or direct hours like "09:00 AM"
  duration?: string;
  location?: string;
  cost?: number | string;
  isAttraction?: boolean; // If true, uses category badge colors instead of time colors
  category?: string;
  rating?: string | number;
  onClick?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = React.memo(({
  name,
  description,
  time,
  duration = '2 hours',
  location,
  cost = 0,
  isAttraction = false,
  category,
  onClick,
}) => {
  const { photo, loading } = usePlacePhoto(name, isAttraction ? 'destination' : 'activity');

  const formatCurrency = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (val === 0) return 'Free';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getBadgeClass = () => {
    if (isAttraction && category) {
      const cat = category.toLowerCase();
      if (cat.includes('adventure')) return 'activity-card__badge--adventure';
      if (cat.includes('nature')) return 'activity-card__badge--nature';
      if (cat.includes('culture')) return 'activity-card__badge--culture';
      if (cat.includes('food')) return 'activity-card__badge--food';
      if (cat.includes('nightlife')) return 'activity-card__badge--nightlife';
      return 'activity-card__badge--default';
    } else {
      const t = time.toLowerCase();
      if (t.includes('morning')) return 'activity-card__badge--morning';
      if (t.includes('afternoon')) return 'activity-card__badge--afternoon';
      if (t.includes('evening') || t.includes('night')) return 'activity-card__badge--evening';
      return 'activity-card__badge--default';
    }
  };

  if (loading) {
    return (
      <div className="card-base activity-card flex flex-col gap-4 hover:transform-none">
        <div className="flex justify-between">
          <div className="skeleton skeleton-text-xs w-16" />
          <div className="skeleton skeleton-text-xs w-24" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton-image-sq skeleton shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton skeleton-text-sm" />
            <div className="skeleton skeleton-text-xs w-full" />
            <div className="skeleton skeleton-text-xs w-[80%]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card-base activity-card card-interactive cursor-pointer" 
      onClick={onClick}
    >
      <div className="activity-card__header">
        <span className={`activity-card__badge ${getBadgeClass()}`}>
          {isAttraction ? category : time}
        </span>
        <div className="activity-card__meta">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="w-3.5 h-3.5" /> {duration}
          </span>
          <span className={cost === 0 || cost === 'Free' ? 'free' : 'price'}>
            {formatCurrency(cost)}
          </span>
        </div>
      </div>

      <div className="activity-card__body">
        <img src={photo} alt={name} className="activity-card__image" />
        
        <div className="activity-card__info">
          <h4 className="activity-card__name">{name}</h4>
          <p className="activity-card__desc">{description}</p>
          {location && (
            <div className="activity-card__location">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ActivityCard.displayName = 'ActivityCard';
