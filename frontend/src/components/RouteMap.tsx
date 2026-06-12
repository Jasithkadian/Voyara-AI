import React, { useEffect, useState, useCallback } from 'react';
import { tripsApi, DailyPlan, HotelRecommendation, AttractionRecommendation, RouteDataResponse, RouteMarker, RouteSegment } from '../services/api';
import { MapPin, Navigation, Clock, Sparkles } from 'lucide-react';

interface RouteMapProps {
  tripId?: number;
  itinerary: DailyPlan[];
  attractions?: AttractionRecommendation[];
  hotels: HotelRecommendation[];
}

export const RouteMap: React.FC<RouteMapProps> = ({ itinerary, hotels }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [routeData, setRouteData] = useState<RouteDataResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateRouteForDay = useCallback(async () => {
    if (!itinerary || itinerary.length === 0) return;
    setLoading(true);
    try {
      const dayData = itinerary.find(d => d.day === activeDay) || itinerary[0];
      const hotel = hotels && hotels.length > 0 ? hotels[0] : { name: "Your Hotel" };
      
      // Construct locations array for Day
      const locations = [];
      locations.push({ name: hotel.name, category: "Hotel" });
      
      dayData.activities.forEach((act) => {
        locations.push({ name: act.title, category: "Activity" });
      });

      if (dayData.restaurants && dayData.restaurants.length > 0) {
        locations.push({ name: dayData.restaurants[0].name, category: "Restaurant" });
      }

      const res = await tripsApi.calculateRoute(locations);
      setRouteData(res);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, [activeDay, itinerary, hotels]);

  useEffect(() => {
    let isMounted = true;
    setTimeout(() => {
      if (isMounted) {
        calculateRouteForDay();
      }
    }, 0);
    return () => {
      isMounted = false;
    };
  }, [calculateRouteForDay]);

  // Get color for category marker
  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'Hotel': return 'bg-primary text-warmWhite';
      case 'Restaurant': return 'bg-coral text-warmWhite';
      case 'Activity': return 'bg-coral text-warmWhite';
      default: return 'bg-stoneMuted text-warmWhite';
    }
  };

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-textSecondary dark:text-warmWhite">Trip Route View</h3>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted font-normal">Visualizing lodging to activity routes</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {itinerary.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeDay === day.day
                  ? 'bg-coral text-warmWhite shadow-md'
                  : 'bg-stoneMuted hover:bg-stoneMuted dark:bg-dark-card dark:hover:bg-stoneMuted text-textSecondary dark:text-dark-text-muted'
              }`}
            >
              Day {day.day} Route
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-stoneMuted dark:bg-dark-card rounded-lg border border-dashed border-stoneMuted dark:border-dark-border">
          <div className="w-8 h-8 rounded-lg border-2 border-stoneMuted border-t-accent animate-spin mb-2"></div>
          <span className="text-xs text-textSecondary dark:text-dark-text-muted">Plotting travel routes...</span>
        </div>
      ) : routeData ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Interactive SVG Map view */}
          <div className="md:col-span-8 h-64 bg-stoneMuted dark:bg-dark-card rounded-lg border border-stoneMuted dark:border-dark-border relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-neutral-800/20 opacity-30"></div>
            
            {/* SVG Visual Lines connecting dots */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary-blue)" />
                  <stop offset="50%" stopColor="var(--color-success)" />
                  <stop offset="100%" stopColor="var(--color-coral-accent)" />
                </linearGradient>
              </defs>
              {routeData.markers && routeData.markers.length > 1 && (
                <path
                  d={`M ${routeData.markers.map((_m: RouteMarker, i: number) => {
                    // Distribute nodes evenly on a wave-shape in the SVG viewport
                    const x = 50 + (i * (80 / (routeData.markers.length - 1))) + "%";
                    const y = 50 + 25 * Math.sin(i * 1.5) + "%";
                    return `${x} ${y}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke="url(#routeGradient)"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  className="animate-route-flow"
                />
              )}
            </svg>

            {/* Render interactive marker nodes */}
            <div className="w-full flex justify-between px-6 z-10">
              {routeData.markers.map((m: RouteMarker, i: number) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center group relative cursor-pointer"
                  style={{ transform: `translateY(${25 * Math.sin(i * 1.5)}px)` }}
                >
                  <div className={`w-9 h-9 rounded-lg ${getMarkerColor(m.category)} flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110`}>
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted bg-warmWhite/95 dark:bg-dark-card border border-stoneMuted dark:border-dark-border px-2 py-1 rounded-sm shadow mt-2 max-w-[80px] truncate text-center block">
                    {m.name}
                  </span>
                  
                  {/* Tooltip detail */}
                  <div className="absolute bottom-12 scale-0 group-hover:scale-100 transition-all bg-stoneMuted text-warmWhite text-xs px-2 py-2 rounded-lg w-40 z-30 pointer-events-none">
                    <span className="block font-semibold">{m.name}</span>
                    <span className="block text-textSecondary mt-1">Role: {m.category}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Map footer stats overlay */}
            <div className="absolute bottom-3 right-3 bg-warmWhite/90 dark:bg-dark-card backdrop-blur border border-stoneMuted dark:border-dark-border px-4 py-2 rounded-lg flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 font-semibold text-textSecondary dark:text-dark-text-muted">
                <Navigation className="w-3.5 h-3.5 text-coral" /> {routeData.totalDistanceKm} km
              </span>
              <span className="flex items-center gap-1 font-semibold text-textSecondary dark:text-dark-text-muted">
                <Clock className="w-3.5 h-3.5 text-primary" /> {routeData.totalTimeMin} mins
              </span>
            </div>
          </div>

          {/* Segment Details Right panel */}
          <div className="md:col-span-4 bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-4 rounded-lg flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs  font-semibold text-textSecondary tracking-normal">Itinerary Route Log</span>
              
              <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                {routeData.segments.map((seg: RouteSegment, sIdx: number) => (
                  <div key={sIdx} className="text-xs border-l-2 border-coral/40 pl-4 py-1 space-y-1">
                    <div className="font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-1">
                      <span>{seg.from}</span>
                      <span className="text-textSecondary text-xs">→</span>
                      <span>{seg.to}</span>
                    </div>
                    <div className="text-xs text-textSecondary flex items-center gap-2">
                      <span>Dist: {seg.distance}</span>
                      <span>•</span>
                      <span>Time: {seg.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-textSecondary dark:text-dark-text-muted pt-4 border-t border-stoneMuted dark:border-dark-border flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-coral animate-pulse" />
              <span>Route optimized dynamically by AI Copilot.</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-textSecondary text-center py-6">Could not load route calculation.</p>
      )}
    </div>
  );
};
