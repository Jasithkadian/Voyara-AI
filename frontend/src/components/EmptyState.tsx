import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, Search, Plane, Home, ArrowRight } from 'lucide-react';

export type EmptyStateType = 'no-trips' | 'no-flights' | 'no-hotels' | 'no-saved-trips';

interface EmptyStateProps {
  type: EmptyStateType;
  onActionClick?: () => void;
  actionText?: string;
  customSuggestion?: string;
}

const TRENDING_DESTINATIONS = [
  { name: 'Goa', country: 'India', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', cost: 'from ₹30,000' },
  { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80', cost: 'from ₹59,000' },
  { name: 'Japan', country: 'East Asia', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80', cost: 'from ₹87,000' },
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onActionClick,
  actionText,
  customSuggestion,
}) => {
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      // Redirect to planner passing the destination search parameter in state
      navigate('/planner', { state: { initialDestination: searchVal } });
    }
  };

  // 1. NO TRIPS IN DASHBOARD (full-bleed photography backdrop + search bar)
  if (type === 'no-trips') {
    return (
      <div 
        className="w-full h-[380px] rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-comfortable text-center select-none shadow-md border border-stoneMuted/30"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />
        
        <div className="relative z-10 space-y-6 max-w-md w-full px-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-md text-primary flex items-center justify-center mx-auto border border-primary/35">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-warmWhite tracking-tight">
              Where should your story start?
            </h3>
            <p className="text-xs text-warmWhite/80 font-normal leading-relaxed">
              Generate custom itineraries, flight connections, and hotel details instantly with AI.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex bg-warmWhite/90 backdrop-blur-md rounded-lg overflow-hidden border border-warmWhite shadow-lg p-1 gap-2">
            <div className="flex-1 flex items-center px-3">
              <Search className="w-4 h-4 text-textSecondary shrink-0 mr-2" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Enter city... e.g. Bali, Japan"
                className="w-full bg-transparent text-textPrimary text-xs focus:outline-none placeholder:text-textSecondary font-semibold"
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/95 text-warmWhite px-5 py-2.5 rounded-md font-semibold text-xs transition-colors shadow-sm"
            >
              Start Plan
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. NO FLIGHTS FOUND
  if (type === 'no-flights') {
    return (
      <div className="py-12 px-6 text-center max-w-sm mx-auto bg-warmWhite/40 dark:bg-dark-elevated/20 border border-stoneMuted dark:border-dark-border/40 rounded-xl space-y-4 shadow-xs">
        <div className="w-11 h-11 rounded-full bg-coral/10 text-coral flex items-center justify-center mx-auto">
          <Plane className="w-5 h-5 -rotate-45" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-bold text-sm text-textPrimary dark:text-warmWhite">No Flights Detected</h4>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed">
            {customSuggestion || "We couldn't locate direct flights for these dates. Try selecting flexible departure dates or secondary airports nearby."}
          </p>
        </div>
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="px-4 py-2 border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-dark-text-muted hover:bg-stoneMuted/30 rounded-md font-semibold text-xs transition-colors"
          >
            {actionText || "Adjust Search Dates"}
          </button>
        )}
      </div>
    );
  }

  // 3. NO HOTELS FOUND
  if (type === 'no-hotels') {
    return (
      <div className="py-12 px-6 text-center max-w-sm mx-auto bg-warmWhite/40 dark:bg-dark-elevated/20 border border-stoneMuted dark:border-dark-border/40 rounded-xl space-y-4 shadow-xs">
        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Home className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-bold text-sm text-textPrimary dark:text-warmWhite">No Lodging recommendations</h4>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed">
            {customSuggestion || "No hotel rooms match your target price criteria. Try raising the budget bracket in replan parameters."}
          </p>
        </div>
        {onActionClick && (
          <button
            onClick={onActionClick}
            className="px-4 py-2 border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-dark-text-muted hover:bg-stoneMuted/30 rounded-md font-semibold text-xs transition-colors"
          >
            {actionText || "Replan Parameters"}
          </button>
        )}
      </div>
    );
  }

  // 4. NO SAVED TRIPS (photography grid of trending destinations + CTA)
  return (
    <div className="w-full text-center space-y-10 py-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <div className="w-12 h-12 rounded-full bg-coral/10 text-coral flex items-center justify-center mx-auto mb-2">
          <Compass className="w-6 h-6 animate-bounce" />
        </div>
        <h3 className="font-display text-2xl font-bold text-textPrimary dark:text-warmWhite tracking-tight">
          No saved trips yet
        </h3>
        <p className="text-xs text-textSecondary dark:text-dark-text-muted max-w-md mx-auto leading-relaxed">
          Create an itinerary in our planner, then save it to see it here in your history. Get inspired by trending locations:
        </p>
      </div>

      {/* Trending Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {TRENDING_DESTINATIONS.map((dest, idx) => (
          <div 
            key={idx}
            onClick={() => navigate('/planner', { state: { initialDestination: dest.name } })}
            className="h-44 rounded-lg relative overflow-hidden flex flex-col justify-end p-comfortable text-left cursor-pointer group shadow-sm hover:shadow-md transition-all border border-stoneMuted/40 dark:border-dark-border/40"
          >
            <img 
              src={dest.image} 
              alt={dest.name} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />
            <div className="relative z-10 text-warmWhite">
              <span className="text-[10px] text-warmWhite/80 uppercase font-semibold tracking-wider">{dest.country}</span>
              <h4 className="font-bold text-base leading-snug">{dest.name}</h4>
              <span className="text-[10px] text-coral font-bold mt-1 block font-mono">{dest.cost}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Link
          to="/planner"
          className="h-11 px-8 bg-primary text-warmWhite font-bold rounded-md shadow-md shadow-primary/20 hover:bg-primary/95 transition-all text-xs inline-flex items-center justify-center gap-2"
        >
          <span>Start Travel Planning</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
