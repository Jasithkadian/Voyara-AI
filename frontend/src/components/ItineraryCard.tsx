import React, { useState } from 'react';
import { DailyPlan } from '../services/api';
import { Clock, MapPin, DollarSign, Calendar, CloudSun, Utensils } from 'lucide-react';

interface ItineraryCardProps {
  dailyPlan: DailyPlan[];
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ dailyPlan }) => {
  const [activeDay, setActiveDay] = useState(1);

  const currentDayData = dailyPlan.find(d => d.day === activeDay) || dailyPlan[0];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getTimeColor = (time: string) => {
    const t = time.toLowerCase();
    if (t.includes('morning')) return 'from-amber-400 to-orange-500 text-white';
    if (t.includes('afternoon')) return 'from-sky-400 to-blue-600 text-white';
    return 'from-indigo-600 to-purple-800 text-white';
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Daily Itinerary</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Your curated day-by-day plan</p>
          </div>
        </div>

        {/* Day selection tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {dailyPlan.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeDay === day.day
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* Weather Header for current day */}
      {currentDayData?.weather && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-neutral-850 rounded-2xl border border-slate-150 dark:border-neutral-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-450 dark:text-neutral-500 font-bold uppercase tracking-wider block">Forecasted Weather</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{currentDayData.weather}</span>
            </div>
          </div>
          <span className="text-xs bg-brand/10 text-brand font-semibold px-2.5 py-1 rounded-lg">
            Plan Adjusted
          </span>
        </div>
      )}

      {/* Activities Timeline */}
      <div className="relative border-l border-slate-100 dark:border-neutral-850 ml-4 pl-6 space-y-8 py-2">
        {currentDayData?.activities.map((activity, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Node */}
            <div className={`absolute -left-[37px] top-1 w-6 h-6 rounded-full bg-gradient-to-tr ${getTimeColor(activity.time)} border-4 border-white dark:border-neutral-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
              <span className="text-[7px] font-bold">{activity.time.charAt(0)}</span>
            </div>

            {/* Content Card */}
            <div className="bg-slate-50/50 dark:bg-neutral-850/30 border border-slate-150/80 dark:border-neutral-800/60 rounded-2xl p-5 hover:bg-slate-50 dark:hover:bg-neutral-850/60 transition-all hover:shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-brand">
                  {activity.time}
                </span>
                
                <div className="flex items-center gap-3 text-xs text-slate-550 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {activity.duration}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-neutral-300">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {activity.estimatedCost === 0 ? "Free" : formatCurrency(activity.estimatedCost)}
                  </span>
                </div>
              </div>

              <h4 className="text-base font-bold text-slate-800 dark:text-white">
                {activity.title}
              </h4>
              
              <p className="text-sm text-slate-655 dark:text-neutral-400 mt-2 leading-relaxed">
                {activity.description}
              </p>

              {activity.location && (
                <div className="mt-3.5 pt-3 border-t border-slate-150 dark:border-neutral-800/80 flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Restaurants Section */}
      {currentDayData?.restaurants && currentDayData.restaurants.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-850">
          <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-4 flex items-center gap-1.5">
            <Utensils className="w-4.5 h-4.5 text-accent" /> Day {activeDay} Culinary Spots
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentDayData.restaurants.map((restaurant, rIdx) => (
              <div 
                key={rIdx}
                className="bg-slate-50/30 dark:bg-neutral-850/20 border border-slate-150 dark:border-neutral-800/50 p-4 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] bg-accent/10 text-accent font-extrabold uppercase px-2 py-0.5 rounded">
                      {restaurant.recommendedMeal}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-neutral-400 flex items-center font-semibold">
                      <DollarSign className="w-3 h-3 text-emerald-500" /> {formatCurrency(restaurant.estimatedCost)}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-slate-800 dark:text-white">{restaurant.name}</h5>
                  <span className="text-[10px] text-slate-450 dark:text-neutral-500 font-semibold">{restaurant.cuisine} cuisine</span>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2 leading-relaxed">
                    {restaurant.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
