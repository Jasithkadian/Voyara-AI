import React, { useState, useEffect } from 'react';
import { DailyPlan } from '../services/api';
import { Calendar, Sun, CloudRain, CloudSun, Utensils, CheckCircle } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { RestaurantCard } from './RestaurantCard';
import { MapWidget, MapMarkerItem } from './MapWidget';
import { useWeather } from '../hooks/useWeather';

interface ItineraryCardProps {
  dailyPlan: DailyPlan[];
  destination?: string;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ dailyPlan, destination = 'Goa' }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  
  const { weather: fetchedWeather } = useWeather(destination, '2026-06-12', dailyPlan.length);

  const currentDayData = dailyPlan.find(d => d.day === activeDay) || dailyPlan[0];

  const handleTabChange = (day: number) => {
    if (day === activeDay) return;
    setFadeState('out');
    setTimeout(() => {
      setActiveDay(day);
      setFocusedIndex(null);
      setFadeState('in');
    }, 150);
  };

  const getWeatherIcon = (weatherStr: string) => {
    const w = weatherStr?.toLowerCase() || '';
    if (w.includes('sun') || w.includes('clear') || w.includes('hot')) {
      return <Sun className="w-[18px] h-[18px] text-[var(--color-warning)] shrink-0" />;
    }
    if (w.includes('rain') || w.includes('shower') || w.includes('storm') || w.includes('monsoon')) {
      return <CloudRain className="w-[18px] h-[18px] text-[var(--color-primary)] shrink-0" />;
    }
    return <CloudSun className="w-[18px] h-[18px] text-[var(--color-text-secondary)] shrink-0" />;
  };

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
    const cardEl = document.getElementById(`timeline-card-${idx}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 sm:p-8 shadow-[var(--shadow-sm)] space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-6 border-b border-[var(--color-border)] pb-6">
        <div className="flex items-center space-x-4 text-left">
          <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-[var(--color-text-primary)] tracking-tight">Daily Itinerary</h3>
            <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1">Your curated schedule</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide max-w-full">
          {dailyPlan.map((day) => {
            const fetchedDay = fetchedWeather?.find(w => w.day === day.day);
            const weatherTemp = fetchedDay ? `${fetchedDay.temp}°C` : (day.weather?.match(/\d+°C/)?.[0] || '');
            const weatherDesc = fetchedDay ? fetchedDay.condition : (day.weather?.split(',')[0].trim() || 'Sunny');
            const weatherString = fetchedDay ? `${weatherDesc}, ${weatherTemp}` : (day.weather || 'Sunny');
            const isCompleted = day.day < activeDay;
            
            return (
              <button
                key={day.day}
                onClick={() => handleTabChange(day.day)}
                className={`px-4 py-2.5 rounded-[var(--radius-sm)] text-sm transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
                  activeDay === day.day
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)] font-medium'
                    : 'bg-transparent border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Day {day.day}</span>
                  {getWeatherIcon(weatherString)}
                  <span className={`font-mono text-[13px] ${activeDay === day.day ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                    {weatherTemp || weatherDesc}
                  </span>
                  {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)] ml-1" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div 
        className={`transition-opacity duration-150 ease-in-out ${fadeState === 'in' ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-[24px] font-bold text-[var(--color-text-primary)]">
              Day {activeDay} Schedule
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Forecast: {currentDayData?.weather || 'Sunny, 28°C'}
            </p>
          </div>
        </div>

        {/* Map Panel Improvement - Full width option */}
        <div className="w-full h-[240px] rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] mb-10 shadow-[var(--shadow-sm)]">
          <MapWidget
            destination={destination}
            items={mapItems}
            focusedIndex={focusedIndex}
            onMarkerClick={handleMarkerClick}
            height="100%"
          />
        </div>

        <div className="itinerary-section">
          <div className="itinerary-section__header">
            <span className="itinerary-section__icon"><Calendar className="w-5 h-5" /></span>
            <h3 className="itinerary-section__title">Daily Activities</h3>
            <span className="itinerary-section__count">{currentDayData?.activities.length || 0} activities</span>
          </div>

          <div className="space-y-4">
            {currentDayData?.activities.map((activity, idx) => {
              const isFocused = focusedIndex === idx;

              return (
                <div 
                  key={idx}
                  id={`timeline-card-${idx}`}
                  onClick={() => handleCardFocus(idx)}
                  className={`transition-all duration-200 rounded-[var(--radius-lg)] cursor-pointer ${
                    isFocused 
                      ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 scale-[1.01] shadow-[var(--shadow-md)]' 
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
                    rating={idx === 0 ? '4.8' : idx === 1 ? '4.5' : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {currentDayData?.restaurants && currentDayData.restaurants.length > 0 && (
          <div className="itinerary-section">
            <div className="itinerary-section__header">
              <span className="itinerary-section__icon"><Utensils className="w-5 h-5" /></span>
              <h3 className="itinerary-section__title">Culinary Spots & Dining</h3>
              <span className="itinerary-section__count">{currentDayData.restaurants.length} spots</span>
            </div>
            
            <div className="space-y-4">
              {currentDayData.restaurants.map((restaurant, rIdx) => {
                const unifiedIdx = (currentDayData?.activities || []).length + rIdx;
                const isFocused = focusedIndex === unifiedIdx;
                
                return (
                  <div 
                    key={rIdx}
                    id={`timeline-card-${unifiedIdx}`}
                    onClick={() => handleCardFocus(unifiedIdx)}
                    className={`transition-all duration-200 rounded-[var(--radius-lg)] cursor-pointer ${
                      isFocused 
                        ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 scale-[1.01] shadow-[var(--shadow-md)]' 
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
    </div>
  );
};
