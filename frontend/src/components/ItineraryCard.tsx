import React, { useState } from 'react';
import { DailyPlan } from '../services/api';
import { Clock, MapPin, DollarSign, Calendar, CloudSun, Utensils, Compass } from 'lucide-react';

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

  const toTitleCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getTimeBadgeColor = (time: string) => {
    const t = time.toLowerCase();
    if (t.includes('morning')) return 'bg-warningAmber/10 text-warningAmber dark:text-warningAmber border-warningAmber/10';
    if (t.includes('afternoon')) return 'bg-primary/10 text-primary dark:text-primary border-primary/10';
    return 'bg-primary/10 text-primary dark:text-primary border-primary/10';
  };

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-lg p-comfortable shadow-sm space-y-comfortable">
      <div className="flex items-center justify-between flex-wrap gap-comfortable border-b border-stoneMuted/50 dark:border-dark-border pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-lg text-textPrimary dark:text-dark-text tracking-tight">Daily Itinerary</h3>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold mt-1">Your curated schedule</p>
          </div>
        </div>

        {/* Day selection tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {dailyPlan.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`px-4 py-2 rounded-sm text-xs font-semibold transition-all whitespace-nowrap border ${
                activeDay === day.day
                  ? 'bg-primary text-warmWhite border-primary shadow-md shadow-primary/15'
                  : 'bg-warmWhite hover:bg-stoneMuted/30 dark:bg-dark-elevated dark:hover:bg-dark-muted border-stoneMuted/50 dark:border-dark-border/50 text-textPrimary dark:text-dark-text'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* Weather Header for current day */}
      {currentDayData?.weather && (
        <div className="p-comfortable bg-warmWhite dark:bg-dark-elevated/60 rounded-md border border-stoneMuted dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold block">Forecasted Weather</span>
              <span className="text-xs font-semibold text-textPrimary dark:text-dark-text">{currentDayData.weather}</span>
            </div>
          </div>
          <span className="text-xs bg-successSage/10 text-successSage dark:text-successSage font-semibold px-2 py-1 rounded-sm border border-successSage/10  tracking-normal">
            Optimized
          </span>
        </div>
      )}

      {/* Activities Timeline */}
      <div className="relative border-l-2 border-stoneMuted/50 dark:border-dark-border ml-4 pl-6 space-y-comfortable py-2">
        {currentDayData?.activities.map((activity, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Node */}
            <div className="absolute -left-6 top-1.5 w-4 h-4 rounded-lg bg-stoneMuted dark:bg-dark-muted border-4 border-warmWhite dark:border-dark-card group-hover:bg-primary group-hover:scale-110 transition-all duration-300" />

            {/* Content Card */}
            <div className="bg-warmWhite/50 dark:bg-dark-elevated/20 border border-stoneMuted/70 dark:border-dark-border/40 rounded-md p-comfortable transition-all hover:bg-warmWhite dark:hover:bg-dark-elevated/40 hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-sm border ${getTimeBadgeColor(activity.time)}`}>
                  {toTitleCase(activity.time)}
                </span>
                
                <div className="flex items-center gap-4 text-xs text-textSecondary dark:text-dark-text-muted">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-4 h-4 text-textSecondary" /> {activity.duration}
                  </span>
                  <span className="flex items-center gap-1 font-semibold font-mono text-coral">
                    {activity.estimatedCost === 0 ? "Free" : formatCurrency(activity.estimatedCost)}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-textPrimary dark:text-dark-text flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary shrink-0" /> {activity.title}
              </h4>
              
              <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-2 leading-relaxed">
                {activity.description}
              </p>

              {activity.location && (
                <div className="mt-comfortable pt-4 border-t border-stoneMuted/50 dark:border-dark-border/60 flex items-center gap-2 text-xs font-normal text-textSecondary dark:text-dark-text-muted">
                  <MapPin className="w-4 h-4 text-primary/70" />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Restaurants Section */}
      {currentDayData?.restaurants && currentDayData.restaurants.length > 0 && (
        <div className="mt-comfortable pt-6 border-t border-stoneMuted/50 dark:border-dark-border">
          <h4 className="font-semibold text-xs text-textPrimary dark:text-dark-text mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-coral" /> Culinary Spots For Day {activeDay}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-comfortable">
            {currentDayData.restaurants.map((restaurant, rIdx) => (
              <div 
                key={rIdx}
                className="bg-warmWhite/40 dark:bg-dark-elevated/10 border border-stoneMuted dark:border-dark-border/40 p-comfortable rounded-md flex flex-col justify-between transition-all hover:bg-warmWhite dark:hover:bg-dark-elevated/20 hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99]"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-coral/10 text-coral font-semibold px-2 py-1 rounded-sm border border-coral/10">
                      {toTitleCase(restaurant.recommendedMeal)}
                    </span>
                    <span className="text-xs font-semibold font-mono text-coral">
                      {formatCurrency(restaurant.estimatedCost)}
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-textPrimary dark:text-dark-text">{restaurant.name}</h5>
                  <span className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold block mt-1">{restaurant.cuisine} cuisine</span>
                  <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-2 leading-relaxed">
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
