import React, { useState } from 'react';
import { DailyPlan } from '../services/api';
import { Calendar, Sun, CloudRain, CloudSun, Utensils, Compass } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { MapWidget, MapMarkerItem } from './MapWidget';
import { useWeather } from '../hooks/useWeather';

interface ItineraryCardProps {
  dailyPlan: DailyPlan[];
  destination?: string;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ dailyPlan, destination = 'Goa' }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  
  const { weather: fetchedWeather } = useWeather(destination, '2026-06-12', dailyPlan.length);

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

  // Construct items for map plotting (activities + restaurants)
  const mapItems: MapMarkerItem[] = [
    ...(currentDayData?.activities || []).map(act => ({
      name: act.title,
      category: 'Activity' as const,
    })),
    ...(currentDayData?.restaurants || []).map(rest => ({
      name: rest.name,
      category: 'Restaurant' as const,
    }))
  ];

  const handleCardFocus = (idx: number) => {
    setFocusedIndex(idx);
  };

  const handleMarkerClick = (idx: number) => {
    setFocusedIndex(idx);
    
    // Scroll corresponding card into view if needed
    const cardEl = document.getElementById(`timeline-card-${idx}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-[12px] p-comfortable sm:p-6 shadow-sm space-y-6">
      {/* Header section with Day tabs */}
      <div className="flex items-center justify-between flex-wrap gap-comfortable border-b border-stoneMuted/50 dark:border-dark-border pb-6">
        <div className="flex items-center space-x-4 text-left">
          <div className="w-11 h-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-textPrimary dark:text-dark-text tracking-tight">Daily Itinerary</h3>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold mt-1">Your curated schedule</p>
          </div>
        </div>

        {/* Day selection tabs with inline weather indicators */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {dailyPlan.map((day) => {
            const fetchedDay = fetchedWeather?.find(w => w.day === day.day);
            const weatherTemp = fetchedDay ? `${fetchedDay.temp}°C` : (day.weather?.match(/\d+°C/)?.[0] || '');
            const weatherDesc = fetchedDay ? fetchedDay.condition : (day.weather?.split(',')[0].trim() || 'Sunny');
            const weatherString = fetchedDay ? `${weatherDesc}, ${weatherTemp}` : (day.weather || 'Sunny');
            
            return (
              <button
                key={day.day}
                onClick={() => {
                  setActiveDay(day.day);
                  setFocusedIndex(null);
                }}
                className={`px-4 py-2.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-2 ${
                  activeDay === day.day
                    ? 'bg-primary text-warmWhite border-primary shadow-md shadow-primary/15'
                    : 'bg-warmWhite hover:bg-stoneMuted/30 dark:bg-dark-elevated dark:hover:bg-dark-muted border-stoneMuted/50 dark:border-dark-border/50 text-textPrimary dark:text-dark-text'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Day {day.day}</span>
                  {getWeatherIcon(weatherString)}
                  <span className={`text-[10px] font-normal ${activeDay === day.day ? 'text-warmWhite/80' : 'text-textSecondary dark:text-dark-text-muted'}`}>
                    {weatherTemp || weatherDesc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Way Interactive Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* Left Column (60% width) - scrollable timeline */}
        <div className="flex-grow lg:w-[60%] space-y-6 text-left">
          
          <div className="mb-4">
            <h3 className="font-display text-[20px] font-bold text-textPrimary dark:text-dark-text">
              Day {activeDay} Schedule
            </h3>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">
              Forecast: {currentDayData?.weather || 'Sunny, 28°C'}
            </p>
          </div>

          <div className="space-y-5">
            {currentDayData?.activities.map((activity, idx) => {
              const variant = idx === 0 ? 'destination' : idx === 1 ? 'activity' : 'data';
              const isFocused = focusedIndex === idx;

              return (
                <div 
                  key={idx}
                  id={`timeline-card-${idx}`}
                  onClick={() => handleCardFocus(idx)}
                  className={`transition-all duration-300 rounded-lg cursor-pointer ${
                    isFocused 
                      ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-dark-card scale-[1.01] shadow-md' 
                      : ''
                  }`}
                >
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
            <div className="pt-10 border-t border-[var(--color-border-subtle)] mt-10">
              <h4 className="font-display font-semibold text-[var(--text-xl)] text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[var(--color-accent)] shrink-0" /> Culinary Spots & Dining
              </h4>
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-8">
                Handpicked restaurants matching your dietary profile.
              </p>
              
              <div className="space-y-5">
                {currentDayData.restaurants.map((restaurant, rIdx) => {
                  const unifiedIdx = (currentDayData?.activities || []).length + rIdx;
                  const isFocused = focusedIndex === unifiedIdx;
                  
                  return (
                    <div 
                      key={rIdx}
                      id={`timeline-card-${unifiedIdx}`}
                      onClick={() => handleCardFocus(unifiedIdx)}
                      className={`transition-all duration-300 rounded-lg cursor-pointer ${
                        isFocused 
                          ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-dark-card scale-[1.01] shadow-md' 
                          : ''
                      }`}
                    >
                      <RestaurantCard
                        name={restaurant.name}
                        description={`${restaurant.description} Try their signature recommendation.`}
                        meal={restaurant.recommendedMeal || 'Dinner'}
                        cuisine={restaurant.cuisine}
                        cost={restaurant.estimatedCost}
                        rating={(4.3 + (rIdx * 0.2)).toFixed(1)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (40% width) - Sticky MapWidget */}
        <div className="w-full lg:w-[40%] min-h-[380px] lg:min-h-0 lg:sticky lg:top-[90px] shrink-0 self-start z-10">
          <MapWidget
            destination={destination}
            items={mapItems}
            focusedIndex={focusedIndex}
            onMarkerClick={handleMarkerClick}
            height="500px"
          />
        </div>
      </div>
    </div>
  );
};

};
        focusedIndex={focusedIndex}
            onMarkerClick={handleMarkerClick}
            height="500px"
          />
        </div>
      </div>
    </div>
  );
};

};
