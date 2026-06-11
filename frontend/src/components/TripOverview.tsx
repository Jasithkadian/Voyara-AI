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
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 bg-brand/10 text-brand px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
          Active Trip Overview
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight flex items-center gap-2">
          Trip to {trip.destination}
        </h2>
        
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500 dark:text-neutral-455">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand" /> From {trip.source}
          </span>
          <span className="text-slate-300 dark:text-neutral-800">•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {trip.days} Days
          </span>
          <span className="text-slate-300 dark:text-neutral-800">•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-accent" /> {trip.travelers} {trip.travelers === 1 ? 'Traveler' : 'Travelers'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full md:w-auto min-w-[240px]">
        <div className="bg-slate-50 dark:bg-neutral-850/50 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800/45">
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 block font-bold uppercase tracking-wider">Target Budget</span>
          <span className="text-lg font-bold text-slate-850 dark:text-white mt-0.5 block">{formatCurrency(trip.budget)}</span>
        </div>
        
        <div className="bg-slate-50 dark:bg-neutral-850/50 p-4 rounded-2xl border border-slate-100 dark:border-neutral-800/45">
          <span className="text-[10px] text-slate-450 dark:text-neutral-500 block font-bold uppercase tracking-wider">Plan Cost</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {formatCurrency(trip.generated_plan.budgetBreakdown.total_cost)}
          </span>
        </div>
      </div>
    </div>
  );
};
