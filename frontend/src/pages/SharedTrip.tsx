import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tripsApi, SavedTrip } from '../services/api';
import { TripOverview } from '../components/TripOverview';
import { ItineraryCard } from '../components/ItineraryCard';
import { HotelCard } from '../components/HotelCard';
import { AttractionCard } from '../components/AttractionCard';
import { BudgetChart } from '../components/BudgetChart';
import { PackingList } from '../components/PackingList';
import { Compass, Sparkles, MapPin, Calendar, Heart } from 'lucide-react';

export const SharedTrip: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    
    const fetchSharedTrip = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await tripsApi.getShared(token);
        setTrip(data);
      } catch (err: any) {
        
        setError("This shared trip itinerary could not be found or is no longer public.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedTrip();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite dark:bg-dark-bg">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg border-4 border-stoneMuted border-t-primary animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-textSecondary dark:text-dark-text-muted">Loading shared itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warmWhite dark:bg-dark-bg p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-12 rounded-lg shadow-xl">
          <Compass className="w-16 h-16 text-coral mx-auto animate-pulse" />
          <h2 className="text-2xl font-sans font-semibold text-textPrimary dark:text-warmWhite">Itinerary Not Found</h2>
          <p className="text-sm text-textSecondary dark:text-dark-text-muted leading-relaxed">
            {error || "We couldn't retrieve this shared trip. Please check the sharing link and try again."}
          </p>
          <Link
            to="/planner"
            className="inline-flex items-center justify-center h-10 px-6 rounded-md font-semibold text-sm bg-primary text-warmWhite hover:bg-primary/90 transition-all shadow-md"
          >
            Create Your Own Trip Plan
          </Link>
        </div>
      </div>
    );
  }

  const plan = trip.generated_plan;

  return (
    <div className="min-h-screen bg-warmWhite dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Public Shared Banner */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-cyan-500 rounded-xl p-8 text-warmWhite shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-300" />
          
          <div className="space-y-2 z-10">
            <span className="bg-white/20 text-white border border-white/10 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-200 fill-cyan-200 animate-pulse" /> Public Shared Itinerary
            </span>
            <h1 className="text-2xl sm:text-3xl font-sans font-bold leading-tight">
              Adventure to {trip.destination}
            </h1>
            <p className="text-sm text-warmWhite/80 max-w-xl">
              You are viewing a custom travel itinerary shared by a voira AI traveler. Check out their spots and design your own matching trip.
            </p>
          </div>

          <div className="shrink-0 z-10 w-full md:w-auto">
            <Link
              to="/planner"
              className="w-full md:w-auto inline-flex items-center justify-center h-12 px-8 rounded-md font-semibold text-sm bg-warmWhite text-primary hover:bg-stoneMuted hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
              Plan Your Own Trip
            </Link>
          </div>
        </div>

        {/* Overview Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Main Content */}
          <div className="lg:col-span-8 space-y-12">
            <TripOverview trip={trip} />

            <ItineraryCard dailyPlan={plan.dailyItinerary} />

            {/* Lodging recommendations list */}
            <div className="space-y-4">
              <h3 className="font-sans font-semibold text-xl text-textPrimary dark:text-dark-text flex items-center gap-2">
                🏨 Recommended Accommodations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {plan.hotelRecommendations.map((hotel, index) => (
                  <HotelCard 
                    key={index} 
                    hotel={hotel} 
                    index={index}
                    isBooked={false}
                  />
                ))}
              </div>
            </div>

            {/* Attractions */}
            <AttractionCard attractions={plan.attractions} />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-12">
            <BudgetChart breakdown={plan.budgetBreakdown} targetBudget={trip.budget} />
            
            <PackingList 
              destination={trip.destination} 
              weatherCondition={plan.dailyItinerary?.[0]?.weather || 'Sunny'}
              interests={trip.interests}
            />
          </div>

        </div>

      </div>
    </div>
  );
};
export default SharedTrip;
