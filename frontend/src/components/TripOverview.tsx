import React from 'react';
import { SavedTrip } from '../services/api';
import { Compass, Calendar, Wallet, Users, MapPin } from 'lucide-react';

interface TripOverviewProps {
  trip: SavedTrip;
}

export const TripOverview: React.FC<TripOverviewProps> = ({ trip }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-textSecondary dark:text-warmWhite tracking-tight flex items-center gap-2">
          Trip to {trip.destination}
        </h2>
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-normal text-textSecondary dark:text-dark-text-muted">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" /> From {trip.source}
          </span>
          <span className="text-textSecondary dark:text-dark-text-muted">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" /> {trip.days} Days
          </span>
          <span className="text-textSecondary dark:text-dark-text-muted">•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-coral" /> {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full md:w-auto min-w-[240px]">
        <div className="bg-stoneMuted dark:bg-dark-card p-4 rounded-lg border border-stoneMuted dark:border-dark-border">
          <span className="text-xs text-textSecondary dark:text-dark-text-muted block font-semibold  tracking-normal">Target Budget</span>
          <span className="text-lg font-semibold text-textSecondary dark:text-warmWhite mt-1 block">{formatCurrency(trip.budget)}</span>
        </div>
        
        <div className="bg-stoneMuted dark:bg-dark-card p-4 rounded-lg border border-stoneMuted dark:border-dark-border">
          <span className="text-xs text-textSecondary dark:text-dark-text-muted block font-semibold  tracking-normal">Plan Cost</span>
          <span className="text-lg font-semibold text-successSage dark:text-successSage mt-1 block">
            {formatCurrency(trip.generated_plan.budgetBreakdown.total_cost)}
          </span>
        </div>
      </div>
    </div>
  );
};
