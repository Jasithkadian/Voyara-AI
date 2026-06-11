import React, { useState } from 'react';
import { DailyPlan } from '../services/api';
import { Calendar, Sun, CloudRain, CloudSun, Utensils, Compass } from 'lucide-react';
import { ActivityCard } from './ActivityCard';

interface ItineraryCardProps {
  dailyPlan: DailyPlan[];
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ dailyPlan }) => {
  const [activeDay, setActiveDay] = useState(1);

  const currentDayData = dailyPlan.find(d => d.day === activeDay) || dailyPlan[0];

  // Map weather strings to weather icons
  const getWeatherIcon = (weatherStr: string) => {
    const w = weatherStr?.toLowerCase() || '';
    if (w.includes('sun') || w.includes('clear') || w.includes('hot')) {
      return <Sun className="w-3.5 h-3.5 text-warningAmber animate-pulse shrink-0" />;
    }
    if (w.includes('rain') || w.includes('shower') || w.includes('storm') || w.includes('monsoon')) {
      return <CloudRain className="w-3.5 h-3.5 text-primary shrink-0" />;
    }
    return <CloudSun className="w-3.5 h-3.5 text-textSecondary dark:text-dark-text-muted shrink-0" />;
  };

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-[12px] p-6 shadow-sm space-y-8">
      {/* Header section with Day tabs */}
      <div className="flex items-center justify-between flex-wrap gap-comfortable border-b border-stoneMuted/50 dark:border-dark-border pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-display font-semibold text-lg text-textPrimary dark:text-dark-text tracking-tight">Daily Itinerary</h3>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold mt-1">Your curated schedule</p>
          </div>
        </div>

        {/* Day selection tabs with inline weather indicators */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {dailyPlan.map((day) => {
            const weatherTemp = day.weather?.match(/\d+°C/)?.[0] || '';
            const weatherDesc = day.weather?.split(',')[0].trim() || 'Sunny';
            return (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`px-4 py-2.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-2 ${
                  activeDay === day.day
                    ? 'bg-primary text-warmWhite border-primary shadow-md shadow-primary/15'
                    : 'bg-warmWhite hover:bg-stoneMuted/30 dark:bg-dark-elevated dark:hover:bg-dark-muted border-stoneMuted/50 dark:border-dark-border/50 text-textPrimary dark:text-dark-text'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Day {day.day}</span>
                  {getWeatherIcon(day.weather)}
                  <span className={`text-[10px] font-normal ${activeDay === day.day ? 'text-warmWhite/80' : 'text-textSecondary dark:text-dark-text-muted'}`}>
                    {weatherTemp || weatherDesc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Title 20px bold (Day X Schedule) */}
      <div className="text-left">
        <h3 className="font-display text-[20px] font-bold text-textPrimary dark:text-dark-text">
          Day {activeDay} Schedule
        </h3>
        <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">
          Forecast: {currentDayData?.weather || 'Sunny, 28°C'}
        </p>
      </div>

      {/* Activities Timeline - Spacing increased to 24px (space-y-6) */}
      <div className="space-y-6">
        {currentDayData?.activities.map((activity, idx) => {
          // Cycle through the 3 variants to showcase the complete design vision:
          // 1st activity = destination (full photo)
          // 2nd activity = activity (photo strip)
          // 3rd+ activity = data (left border color indicator)
          const variant = idx === 0 ? 'destination' : idx === 1 ? 'activity' : 'data';

          return (
            <div key={idx} className="relative group pl-2">
              <ActivityCard
                name={activity.title}
                description={activity.description}
                time={activity.time}
                duration={activity.duration}
                location={activity.location}
                cost={activity.estimatedCost}
                variant={variant}
                rating={idx === 0 ? '4.8' : idx === 1 ? '4.5' : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Recommended Restaurants Section - clearly labeled, high card weight */}
      {currentDayData?.restaurants && currentDayData.restaurants.length > 0 && (
        <div className="pt-8 border-t border-stoneMuted/50 dark:border-dark-border text-left">
          <h4 className="font-display font-bold text-[18px] text-textPrimary dark:text-dark-text mb-4 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-coral shrink-0" /> Culinary Spots & Dining
          </h4>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted mb-6">
            Handpicked restaurants matching your dietary profile.
          </p>
          <div className="space-y-6">
            {currentDayData.restaurants.map((restaurant, rIdx) => (
              <ActivityCard
                key={rIdx}
                name={restaurant.name}
                description={`${restaurant.description} Try their signature recommendation.`}
                time={restaurant.recommendedMeal || 'Dinner'}
                duration="Dining"
                location={`${restaurant.cuisine} Cuisine`}
                cost={restaurant.estimatedCost}
                variant="activity" // Give it the same high card weight with a photo strip
                rating={(4.3 + (rIdx * 0.2)).toFixed(1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
