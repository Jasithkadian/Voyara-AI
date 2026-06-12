import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi } from '../services/api';
import { Sparkles, Navigation, ShieldCheck } from 'lucide-react';
import { DestinationCard } from '../components/DestinationCard';

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
      
      setError('Failed to deploy demo package. Please try again.');
    } finally {
      setLoadingDest(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-primary/10 text-primary rounded-lg text-xs font-semibold  tracking-normal">
          <Sparkles className="w-3.5 h-3.5" /> voira Demo Sandbox
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
      <div className="flex flex-wrap justify-center gap-8">
        {demos.map((dest) => {
          const isProcessing = loadingDest === dest.id;
          return (
            <DestinationCard
              key={dest.id}
              name={dest.name}
              region={dest.country}
              price={dest.budget}
              onClick={() => handleLaunchDemo(dest)}
              isLoadingAction={isProcessing}
            />
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
