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
      bgGradient: 'from-amber-400 to-orange-500',
    },
    {
      id: 'bali',
      name: 'Bali',
      country: 'Indonesia',
      description: 'Ubud rice terraces, sacred temples, cliffside fire dances, and forest retreats.',
      duration: '7 Days',
      budget: '₹59,000',
      bgGradient: 'from-emerald-400 to-teal-500',
    },
    {
      id: 'dubai',
      name: 'Dubai',
      country: 'UAE',
      description: 'Burj Khalifa sky deck, desert dunes safaris, mega malls, and luxury dining.',
      duration: '5 Days',
      budget: '₹86,000',
      bgGradient: 'from-sky-400 to-blue-500',
    },
    {
      id: 'switzerland',
      name: 'Switzerland',
      country: 'Europe',
      description: 'Zurich old town, Grindelwald glacier walks, alpine cable cars, and Swiss chocolate.',
      duration: '6 Days',
      budget: '₹1,12,000',
      bgGradient: 'from-rose-400 to-red-500',
    },
    {
      id: 'japan',
      name: 'Japan',
      country: 'East Asia',
      description: 'Tokyo crossings, Senso-ji temple tours, teamLab digital art, and Kyoto ryokans.',
      duration: '7 Days',
      budget: '₹87,000',
      bgGradient: 'from-indigo-400 to-violet-500',
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Investor Demo Mode
        </div>
        <h2 className="text-4xl font-extrabold text-slate-850 dark:text-white tracking-tight">
          One-Click Experience Sandbox
        </h2>
        <p className="text-sm text-slate-500 dark:text-neutral-450 leading-relaxed">
          Skip registration entirely. Launch high-fidelity pre-curated travel plans instantly and experience booking flows, route segments, and analytics immediately.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-2xl border border-red-150 text-center max-w-lg mx-auto">
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
              className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Visual Header Gradient block */}
                <div className={`w-full h-32 bg-gradient-to-br ${dest.bgGradient} rounded-2xl mb-4 relative overflow-hidden flex items-end p-4`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10 text-white">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">{dest.country}</span>
                    <h3 className="font-extrabold text-2xl tracking-tight leading-none mt-1">{dest.name}</h3>
                  </div>
                  <Globe className="w-16 h-16 text-white/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform" />
                </div>

                <p className="text-xs text-slate-500 dark:text-neutral-450 leading-relaxed min-h-[50px]">
                  {dest.description}
                </p>

                <div className="mt-6 flex justify-between items-center text-xs font-bold border-t border-slate-100 dark:border-neutral-850 pt-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Duration</span>
                    <span className="text-slate-700 dark:text-neutral-300">{dest.duration}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Estimated Cost</span>
                    <span className="text-slate-700 dark:text-neutral-300">{dest.budget}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handleLaunchDemo(dest)}
                  disabled={!!loadingDest}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    isProcessing
                      ? 'bg-slate-100 dark:bg-neutral-850 text-slate-400 cursor-wait'
                      : 'bg-brand hover:bg-brand-600 text-white hover:shadow-md'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-brand animate-spin" />
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

      <div className="max-w-2xl mx-auto bg-slate-50 dark:bg-neutral-850 border border-slate-100 dark:border-neutral-800 p-6 rounded-3xl flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Sandbox Environment Details</h4>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
            Selecting a package above provisions a valid guest session credentials automatically in your local browser cache. Any mock transaction checkout you test, expenses logged, or itinerary chat changes you ask will be saved persistently to the guest account database scope.
          </p>
        </div>
      </div>
    </div>
  );
};
