import React, { useState } from 'react';
import { DailyPlan } from '../services/api';
import { Calendar, Sun, CloudRain, CloudSun, Utensils, CheckCircle, X, RefreshCw, Clock, Coffee, Sunset } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { RestaurantCard } from './RestaurantCard';
import { MapWidget, MapMarkerItem } from './MapWidget';
import { useWeather } from '../hooks/useWeather';
import { motion, AnimatePresence } from 'framer-motion';
import { DiningType } from '../types';

interface ItineraryCardProps {
  dailyPlan: DailyPlan[];
  destination?: string;
  tripId?: number;
  onRegenerateDay?: (dayNumber: number) => Promise<void>;
  diningTier?: DiningType;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({ 
  dailyPlan, 
  destination = 'Goa', 
  tripId = 0,
  onRegenerateDay,
  diningTier = 'mid-range'
}) => {
  const [activeDay, setActiveDay] = useState(1);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
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

  const handleRegenerate = async () => {
    if (!onRegenerateDay) return;
    setRegenerating(true);
    try {
      await onRegenerateDay(activeDay);
    } catch (err) {
      console.error("Failed to regenerate day:", err);
    } finally {
      setRegenerating(false);
    }
  };

  const getWeatherIcon = (weatherStr: string, isActiveTab: boolean) => {
    const w = weatherStr?.toLowerCase() || '';
    const iconClass = `w-[18px] h-[18px] shrink-0 ${isActiveTab ? 'weather-bounce' : ''}`;
    if (w.includes('sun') || w.includes('clear') || w.includes('hot')) {
      return <Sun className={`${iconClass} text-amber-400`} />;
    }
    if (w.includes('rain') || w.includes('shower') || w.includes('storm') || w.includes('monsoon')) {
      return <CloudRain className={`${iconClass} text-blue-400`} />;
    }
    return <CloudSun className={`${iconClass} text-stone-400`} />;
  };

  // Organize items for the active day into Morning, Afternoon, Evening slots
  const activities = currentDayData?.activities || [];
  const restaurants = currentDayData?.restaurants || [];

  const morningActivities = activities.filter(a => a.time?.toLowerCase().includes('morning'));
  const morningRestaurants = restaurants.filter(r => r.recommendedMeal?.toLowerCase().includes('breakfast'));

  const afternoonActivities = activities.filter(a => a.time?.toLowerCase().includes('afternoon') || a.time?.toLowerCase().includes('lunch'));
  const afternoonRestaurants = restaurants.filter(r => r.recommendedMeal?.toLowerCase().includes('lunch') || r.recommendedMeal?.toLowerCase().includes('afternoon'));

  const eveningActivities = activities.filter(a => a.time?.toLowerCase().includes('evening') || a.time?.toLowerCase().includes('dinner') || a.time?.toLowerCase().includes('night'));
  const eveningRestaurants = restaurants.filter(r => r.recommendedMeal?.toLowerCase().includes('dinner') || r.recommendedMeal?.toLowerCase().includes('evening') || r.recommendedMeal?.toLowerCase().includes('night'));

  // Fallback for items with missing or unmatched time slots
  const unmatchedActivities = activities.filter(a => 
    !a.time?.toLowerCase().includes('morning') && 
    !a.time?.toLowerCase().includes('afternoon') && 
    !a.time?.toLowerCase().includes('lunch') && 
    !a.time?.toLowerCase().includes('evening') && 
    !a.time?.toLowerCase().includes('dinner') && 
    !a.time?.toLowerCase().includes('night')
  );
  
  const unmatchedRestaurants = restaurants.filter(r => 
    !r.recommendedMeal?.toLowerCase().includes('breakfast') && 
    !r.recommendedMeal?.toLowerCase().includes('lunch') && 
    !r.recommendedMeal?.toLowerCase().includes('afternoon') && 
    !r.recommendedMeal?.toLowerCase().includes('dinner') && 
    !r.recommendedMeal?.toLowerCase().includes('evening') && 
    !r.recommendedMeal?.toLowerCase().includes('night')
  );

  // Put unmatched items in sensible default categories
  const morningSection = {
    activities: morningActivities,
    restaurants: morningRestaurants
  };

  const afternoonSection = {
    activities: [...afternoonActivities, ...unmatchedActivities],
    restaurants: afternoonRestaurants
  };

  const eveningSection = {
    activities: eveningActivities,
    restaurants: [...eveningRestaurants, ...unmatchedRestaurants]
  };

  // Compile map coordinates sequentially
  const mapItems: MapMarkerItem[] = [
    ...activities.map(act => ({ name: act.title, category: 'Activity' as const, price: '₹' + act.estimatedCost })),
    ...restaurants.map(rest => ({ name: rest.name, category: 'Restaurant' as const, price: '₹' + rest.estimatedCost }))
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-left backdrop-blur-xl relative">
      {regenerating && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center rounded-2xl z-50">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-stone-300 uppercase tracking-widest animate-pulse">Regenerating Day {activeDay}...</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-6 border-b border-white/10 pb-6">
        <div className="flex items-center space-x-4 text-left">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white tracking-tight">Daily Itinerary</h3>
            <p className="text-xs text-stone-400 font-medium mt-1">Your curated schedule</p>
          </div>
        </div>

        {/* Horizontal scroll Day tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide max-w-full snap-x snap-mandatory scroll-smooth">
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
                className={`day-tab px-4 py-2.5 rounded-xl text-xs transition-all whitespace-nowrap border flex items-center justify-center gap-2 snap-start min-w-[80px] flex-shrink-0 ${
                  activeDay === day.day
                    ? 'bg-purple-600 border-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                    : 'bg-white/5 border-white/5 text-stone-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>Day {day.day}</span>
                  {getWeatherIcon(weatherString, activeDay === day.day)}
                  <span className={`font-mono font-bold text-[11px] ${activeDay === day.day ? 'text-white' : 'text-stone-500'}`}>
                    {weatherTemp || weatherDesc}
                  </span>
                  {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={fadeState === 'in' ? 'day-fade-in' : 'day-fade-out'}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-[22px] font-extrabold text-white">
              Day {activeDay} Schedule
            </h3>
            <p className="text-xs text-stone-400 mt-1 font-semibold">
              Forecast: {currentDayData?.weather || 'Sunny, 28°C'}
            </p>
          </div>
          
          {onRegenerateDay && (
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="btn-secondary h-10 px-4 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 text-xs text-stone-300 hover:text-white font-bold rounded-xl active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Day {activeDay}</span>
            </button>
          )}
        </div>

        {/* Map Panel - Hidden on Mobile */}
        <div className="hidden md:block w-full h-[260px] rounded-2xl overflow-hidden border border-white/10 mb-8 shadow-lg">
          <MapWidget
            destination={destination}
            items={mapItems}
            focusedIndex={focusedIndex}
            onMarkerClick={handleMarkerClick}
            height="100%"
          />
        </div>

        {/* Mobile View on Map Button */}
        <div className="md:hidden mb-6">
          <button 
            onClick={() => setShowMobileMap(true)}
            className="w-full h-11 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-stone-300 hover:text-white flex items-center justify-center gap-2 text-xs font-bold"
          >
            <span>View on Map</span>
          </button>
        </div>

        {/* Mobile Full Screen Map Modal */}
        {showMobileMap && (
          <div className="fixed inset-0 z-[9999] bg-[#07080f] flex flex-col font-sans">
            <div className="h-14 bg-stone-900 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
              <span className="font-bold text-sm text-white">Day {activeDay} Map</span>
              <button 
                onClick={() => setShowMobileMap(false)}
                className="p-2 rounded-full hover:bg-white/5 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow w-full relative">
              <MapWidget
                destination={destination}
                items={mapItems}
                focusedIndex={focusedIndex}
                onMarkerClick={(idx) => {
                  handleMarkerClick(idx);
                  setShowMobileMap(false);
                }}
                height="100%"
              />
            </div>
          </div>
        )}

        {/* Organized Time slots checklist */}
        <div className="space-y-8 mt-4">
          {/* Morning Section */}
          {(morningSection.activities.length > 0 || morningSection.restaurants.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Coffee className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-400">Morning</h4>
              </div>
              <div className="space-y-4 pl-6 border-l border-white/5">
                {morningSection.activities.map((activity, idx) => {
                  const actualIndex = activities.indexOf(activity);
                  const isFocused = focusedIndex === actualIndex;
                  return (
                    <div 
                      key={`act-${idx}`}
                      id={`timeline-card-${actualIndex}`}
                      onClick={() => handleCardFocus(actualIndex)}
                      className={`transition-all duration-200 rounded-xl ${isFocused ? 'ring-2 ring-purple-500 scale-[1.01] shadow-lg' : ''}`}
                    >
                      <ActivityCard
                        name={activity.title}
                        description={activity.description}
                        time={activity.time}
                        duration={activity.duration}
                        location={activity.location}
                        cost={activity.estimatedCost}
                      />
                    </div>
                  );
                })}
                {morningSection.restaurants.map((rest, idx) => {
                  const actualIndex = activities.length + restaurants.indexOf(rest);
                  const isFocused = focusedIndex === actualIndex;
                  return (
                    <div 
                      key={`rest-${idx}`}
                      id={`timeline-card-${actualIndex}`}
                      onClick={() => handleCardFocus(actualIndex)}
                      className={`transition-all duration-200 rounded-xl ${isFocused ? 'ring-2 ring-purple-500 scale-[1.01] shadow-lg' : ''}`}
                    >
                      <RestaurantCard
                        name={rest.name}
                        description={rest.description}
                        meal={rest.recommendedMeal || 'Breakfast'}
                        cuisine={rest.cuisine}
                        cost={rest.estimatedCost}
                        diningTier={diningTier}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Afternoon Section */}
          {(afternoonSection.activities.length > 0 || afternoonSection.restaurants.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Clock className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-blue-400">Afternoon</h4>
              </div>
              <div className="space-y-4 pl-6 border-l border-white/5">
                {afternoonSection.activities.map((activity, idx) => {
                  const actualIndex = activities.indexOf(activity);
                  const isFocused = focusedIndex === actualIndex;
                  return (
                    <div 
                      key={`act-${idx}`}
                      id={`timeline-card-${actualIndex}`}
                      onClick={() => handleCardFocus(actualIndex)}
                      className={`transition-all duration-200 rounded-xl ${isFocused ? 'ring-2 ring-purple-500 scale-[1.01] shadow-lg' : ''}`}
                    >
                      <ActivityCard
                        name={activity.title}
                        description={activity.description}
                        time={activity.time}
                        duration={activity.duration}
                        location={activity.location}
                        cost={activity.estimatedCost}
                      />
                    </div>
                  );
                })}
                {afternoonSection.restaurants.map((rest, idx) => {
                  const actualIndex = activities.length + restaurants.indexOf(rest);
                  const isFocused = focusedIndex === actualIndex;
                  return (
                    <div 
                      key={`rest-${idx}`}
                      id={`timeline-card-${actualIndex}`}
                      onClick={() => handleCardFocus(actualIndex)}
                      className={`transition-all duration-200 rounded-xl ${isFocused ? 'ring-2 ring-purple-500 scale-[1.01] shadow-lg' : ''}`}
                    >
                      <RestaurantCard
                        name={rest.name}
                        description={rest.description}
                        meal={rest.recommendedMeal || 'Lunch'}
                        cuisine={rest.cuisine}
                        cost={rest.estimatedCost}
                        diningTier={diningTier}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evening Section */}
          {(eveningSection.activities.length > 0 || eveningSection.restaurants.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Sunset className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-purple-400">Evening</h4>
              </div>
              <div className="space-y-4 pl-6 border-l border-white/5">
                {eveningSection.activities.map((activity, idx) => {
                  const actualIndex = activities.indexOf(activity);
                  const isFocused = focusedIndex === actualIndex;
                  return (
                    <div 
                      key={`act-${idx}`}
                      id={`timeline-card-${actualIndex}`}
                      onClick={() => handleCardFocus(actualIndex)}
                      className={`transition-all duration-200 rounded-xl ${isFocused ? 'ring-2 ring-purple-500 scale-[1.01] shadow-lg' : ''}`}
                    >
                      <ActivityCard
                        name={activity.title}
                        description={activity.description}
                        time={activity.time}
                        duration={activity.duration}
                        location={activity.location}
                        cost={activity.estimatedCost}
                      />
                    </div>
                  );
                })}
                {eveningSection.restaurants.map((rest, idx) => {
                  const actualIndex = activities.length + restaurants.indexOf(rest);
                  const isFocused = focusedIndex === actualIndex;
                  return (
                    <div 
                      key={`rest-${idx}`}
                      id={`timeline-card-${actualIndex}`}
                      onClick={() => handleCardFocus(actualIndex)}
                      className={`transition-all duration-200 rounded-xl ${isFocused ? 'ring-2 ring-purple-500 scale-[1.01] shadow-lg' : ''}`}
                    >
                      <RestaurantCard
                        name={rest.name}
                        description={rest.description}
                        meal={rest.recommendedMeal || 'Dinner'}
                        cuisine={rest.cuisine}
                        cost={rest.estimatedCost}
                        diningTier={diningTier}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
