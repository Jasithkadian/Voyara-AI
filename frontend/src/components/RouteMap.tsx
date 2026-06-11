import React, { useEffect, useState } from 'react';
import { tripsApi } from '../services/api';
import { MapPin, Navigation, Clock, Eye, Sparkles } from 'lucide-react';

interface RouteMapProps {
  tripId: number;
  itinerary: any[];
  attractions: any[];
  hotels: any[];
}

export const RouteMap: React.FC<RouteMapProps> = ({ tripId, itinerary, attractions, hotels }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateRouteForDay();
  }, [activeDay, itinerary, hotels]);

  const calculateRouteForDay = async () => {
    if (!itinerary || itinerary.length === 0) return;
    setLoading(true);
    try {
      const dayData = itinerary.find(d => d.day === activeDay) || itinerary[0];
      const hotel = hotels && hotels.length > 0 ? hotels[0] : { name: "Your Hotel" };
      
      // Construct locations array for Day
      const locations = [];
      locations.push({ name: hotel.name, category: "Hotel" });
      
      dayData.activities.forEach((act: any) => {
        locations.push({ name: act.title, category: "Activity" });
      });

      if (dayData.restaurants && dayData.restaurants.length > 0) {
        locations.push({ name: dayData.restaurants[0].name, category: "Restaurant" });
      }

      const res = await tripsApi.calculateRoute(locations);
      setRouteData(res);
    } catch (err) {
      console.error("Failed to load route data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get color for category marker
  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'Hotel': return 'bg-blue-500 text-white';
      case 'Restaurant': return 'bg-rose-500 text-white';
      case 'Activity': return 'bg-purple-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Trip Route View</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Visualizing lodging to activity routes</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1.5 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {itinerary.map((day) => (
            <button
              key={day.day}
              onClick={() => setActiveDay(day.day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeDay === day.day
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300'
              }`}
            >
              Day {day.day} Route
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-850 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-accent animate-spin mb-2"></div>
          <span className="text-xs text-slate-500 dark:text-neutral-400">Plotting travel routes...</span>
        </div>
      ) : routeData ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          
          {/* Interactive SVG Map view */}
          <div className="md:col-span-8 h-64 bg-slate-50 dark:bg-neutral-850 rounded-2xl border border-slate-200 dark:border-neutral-800/80 relative overflow-hidden flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-neutral-800/20 opacity-30"></div>
            
            {/* SVG Visual Lines connecting dots */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0a84ff" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
              {routeData.markers && routeData.markers.length > 1 && (
                <path
                  d={`M ${routeData.markers.map((_: any, i: number) => {
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
              {routeData.markers.map((m: any, i: number) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center group relative cursor-pointer"
                  style={{ transform: `translateY(${25 * Math.sin(i * 1.5)}px)` }}
                >
                  <div className={`w-9 h-9 rounded-full ${getMarkerColor(m.category)} flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110`}>
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-800 dark:text-neutral-200 bg-white/95 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 px-2 py-0.5 rounded shadow mt-1.5 max-w-[80px] truncate text-center block">
                    {m.name}
                  </span>
                  
                  {/* Tooltip detail */}
                  <div className="absolute bottom-12 scale-0 group-hover:scale-100 transition-all bg-neutral-900 text-white text-[9px] px-2.5 py-1.5 rounded-lg w-40 z-30 pointer-events-none">
                    <span className="block font-bold">{m.name}</span>
                    <span className="block text-slate-400 mt-0.5">Role: {m.category}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Map footer stats overlay */}
            <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border border-slate-200 dark:border-neutral-800 px-3 py-1.5 rounded-xl flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-neutral-300">
                <Navigation className="w-3.5 h-3.5 text-accent" /> {routeData.totalDistanceKm} km
              </span>
              <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-brand" /> {routeData.totalTimeMin} mins
              </span>
            </div>
          </div>

          {/* Segment Details Right panel */}
          <div className="md:col-span-4 bg-slate-50 dark:bg-neutral-850 border border-slate-150 dark:border-neutral-800/60 p-4 rounded-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Itinerary Route Log</span>
              
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {routeData.segments.map((seg: any, sIdx: number) => (
                  <div key={sIdx} className="text-xs border-l-2 border-accent/40 pl-3 py-0.5 space-y-0.5">
                    <div className="font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1">
                      <span>{seg.from}</span>
                      <span className="text-slate-400 text-[10px]">→</span>
                      <span>{seg.to}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>Dist: {seg.distance}</span>
                      <span>•</span>
                      <span>Time: {seg.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[9px] text-slate-450 dark:text-neutral-500 pt-3 border-t border-slate-200 dark:border-neutral-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>Route optimized dynamically by AI Copilot.</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-6">Could not load route calculation.</p>
      )}
    </div>
  );
};
