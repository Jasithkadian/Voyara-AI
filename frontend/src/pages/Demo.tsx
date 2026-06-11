import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi } from '../services/api';
import { Sparkles, Navigation, Globe, Compass, ArrowRight, ShieldCheck } from 'lucide-react';

interface DestinationDemo {
  id: string;
  name: string;
  country: string;
  description: string;
  duration: string;
  budget: string;
  bgGradient: string;
}

export const Demo: React.FC = () => {
  const { isAuthenticated, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [loadingDest, setLoadingDest] = useState<string | null>(null);
  const [error, setError] = useState('');

  const demos: DestinationDemo[] = [
    {
      id: 'goa',
      name: 'Goa',
      country: 'India',
      description: 'Tropical beaches, historic Portuguese forts, and vibrant seafood dining.',
      duration: '3 Days',
      budget: '₹30,000',
      bgGradient: 'from-warningAmber to-warningAmber',
    },
    {
      id: 'bali',
      name: 'Bali',
      country: 'Indonesia',
      description: 'Ubud rice terraces, sacred temples, cliffside fire dances, and forest retreats.',
      duration: '7 Days',
      budget: '₹59,000',
      bgGradient: 'from-successSage to-successSage',
    },
    {
      id: 'dubai',
      name: 'Dubai',
      country: 'UAE',
      description: 'Burj Khalifa sky deck, desert dunes safaris, mega malls, and luxury dining.',
      duration: '5 Days',
      budget: '₹86,000',
      bgGradient: 'from-primary to-primary',
    },
    {
      id: 'switzerland',
      name: 'Switzerland',
      country: 'Europe',
      description: 'Zurich old town, Grindelwald glacier walks, alpine cable cars, and Swiss chocolate.',
      duration: '6 Days',
      budget: '₹1,12,000',
      bgGradient: 'from-coral to-coral',
    },
    {
      id: 'japan',
      name: 'Japan',
      country: 'East Asia',
      description: 'Tokyo crossings, Senso-ji temple tours, teamLab digital art, and Kyoto ryokans.',
      duration: '7 Days',
      budget: '₹87,000',
      bgGradient: 'from-primary to-violet-500',
    },
  ];

  const handleLaunchDemo = async (dest: DestinationDemo) => {
    setLoadingDest(dest.id);
    setError('');
    try {
      // 1. If not authenticated, automatically log in as Guest
      if (!isAuthenticated) {
        await loginGuest();
      }

      // 2. Fetch the preloaded high-fidelity itinerary
      const itinerary = await tripsApi.getDemoItinerary(dest.name);

      // 3. Save the trip package to the user's database portfolio
      const savePayload = {
        source: 'Delhi',
        destination: itinerary.tripSummary.destination,
        budget: itinerary.budgetBreakdown.total_cost,
        days: itinerary.tripSummary.days,
        travelers: itinerary.tripSummary.travelers,
        interests: ['Beaches', 'Luxury', 'Adventure', 'Food'],
        generated_plan: itinerary
      };

      const saveResult = await tripsApi.save(savePayload);
      
      // 4. Redirect to the Dashboard focusing on this trip
      navigate('/dashboard/trip', { state: { trip: saveResult.trip } });
    } catch (err: any) {
      console.error(err);
      setError('Failed to deploy demo package. Please try again.');
    } finally {
      setLoadingDest(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold  tracking-normal">
          <Sparkles className="w-3.5 h-3.5" /> Voira Demo Sandbox
        </div>
        <h2 className="text-4xl font-semibold text-textSecondary dark:text-warmWhite tracking-tight">
          One-Click Experience Sandbox
        </h2>
        <p className="text-sm text-textSecondary dark:text-dark-text-muted leading-relaxed">
          Experience the full product in 30 seconds. Launch high-fidelity pre-curated travel plans instantly and experience booking flows, route segments, and analytics immediately.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-coral dark:bg-coral/20 text-coral dark:text-coral rounded-lg border border-coral text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Grid of demo cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((dest) => {
          const isProcessing = loadingDest === dest.id;
          return (
            <div
              key={dest.id}
              className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Visual Header Gradient block */}
                <div className={`w-full h-32 bg-gradient-to-br ${dest.bgGradient} rounded-lg mb-4 relative overflow-hidden flex items-end p-4`}>
                  <div className="absolute inset-0 bg-textPrimary/10" />
                  <div className="relative z-10 text-warmWhite">
                    <span className="text-xs  font-semibold tracking-normal text-warmWhite/80">{dest.country}</span>
                    <h3 className="font-semibold text-2xl tracking-tight leading-none mt-1">{dest.name}</h3>
                  </div>
                  <Globe className="w-16 h-16 text-warmWhite/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
                </div>

                <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed min-h-[50px]">
                  {dest.description}
                </p>

                <div className="mt-6 flex justify-between items-center text-xs font-semibold border-t border-stoneMuted dark:border-dark-border pt-4">
                  <div>
                    <span className="text-xs  font-semibold text-textSecondary block tracking-normal">Duration</span>
                    <span className="text-textSecondary dark:text-dark-text-muted">{dest.duration}</span>
                  </div>
                  <div>
                    <span className="text-xs  font-semibold text-textSecondary block tracking-normal">Estimated Cost</span>
                    <span className="text-textSecondary dark:text-dark-text-muted">{dest.budget}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleLaunchDemo(dest)}
                  disabled={!!loadingDest}
                  className={`w-full py-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isProcessing
                      ? 'bg-stoneMuted dark:bg-dark-card text-textSecondary cursor-wait'
                      : 'bg-primary hover:bg-primary text-warmWhite hover:shadow-md'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 rounded-lg border-2 border-stoneMuted border-t-brand animate-spin" />
                      <span>Deploying Sandbox...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Demo Itinerary</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-lg flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="font-semibold text-sm text-textSecondary dark:text-warmWhite">Sandbox Environment Details</h4>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed">
            Selecting a package above provisions a valid guest session credentials automatically in your local browser cache. Any mock transaction checkout you test, expenses logged, or itinerary chat changes you ask will be saved persistently to the guest account database scope.
          </p>
        </div>
      </div>
    </div>
  );
};
