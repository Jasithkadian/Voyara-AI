import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi } from '../services/api';
import { Sparkles, MapPin, Compass, ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { DestinationCard } from '../components/DestinationCard';

interface TravelStyleOption {
  id: string;
  label: string;
  image: string;
}

const STYLE_OPTIONS: TravelStyleOption[] = [
  { id: 'beaches', label: '🏖️ Beaches & Sun', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
  { id: 'adventure', label: '🧗 Adventure Trekking', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' },
  { id: 'culture', label: '🏛️ Culture & Heritage', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=400&q=80' },
  { id: 'food', label: '🍕 Culinary & Fine Dining', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
  { id: 'city', label: '🏙️ City Skylines & Neon', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80' },
  { id: 'relaxation', label: '🧘 Spa & Wellness', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80' },
];

export const Onboarding: React.FC = () => {
  const { loginGuest, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [homeCity, setHomeCity] = useState('Delhi');
  const [budgetRange, setBudgetRange] = useState('Mid-Range');
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');

  const handleStyleToggle = (id: string) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Derive suggested destination based on selected travel styles
  const getRecommendation = () => {
    if (selectedStyles.includes('beaches') || selectedStyles.includes('relaxation')) {
      return {
        name: 'Goa',
        country: 'India',
        description: 'Tropical coastlines, Portuguese churches, and pristine beaches.',
        days: 3,
        budget: 30000,
        interests: ['Beaches', 'Food', 'Relaxation']
      };
    }
    if (selectedStyles.includes('adventure')) {
      return {
        name: 'Switzerland',
        country: 'Europe',
        description: 'Alpine glacier walks, Grindelwald mountain tours, and high-altitude hiking.',
        days: 6,
        budget: 112000,
        interests: ['Adventure', 'Nature', 'Luxury']
      };
    }
    if (selectedStyles.includes('city') || selectedStyles.includes('culture')) {
      return {
        name: 'Japan',
        country: 'East Asia',
        description: 'Tokyo crossings, Senso-ji temple tours, teamLab digital art, and Kyoto ryokans.',
        days: 7,
        budget: 87000,
        interests: ['Culture', 'City', 'Shopping']
      };
    }
    return {
      name: 'Dubai',
      country: 'UAE',
      description: 'Desert dune safaris, Burj Khalifa sky decks, and luxury shopping.',
      days: 5,
      budget: 86000,
      interests: ['Luxury', 'Shopping', 'City']
    };
  };

  const recommendation = getRecommendation();

  const handleDeployRecommendation = async () => {
    setDeploying(true);
    setError('');
    try {
      // 1. If not logged in, login as guest
      if (!isAuthenticated) {
        await loginGuest();
      }

      // 2. Fetch the preloaded itinerary for the suggested destination
      const itinerary = await tripsApi.getDemoItinerary(recommendation.name);

      // 3. Save it to history portfolio
      const payload = {
        source: homeCity,
        destination: itinerary.tripSummary.destination,
        budget: recommendation.budget,
        days: recommendation.days,
        travelers: 1,
        interests: recommendation.interests,
        generated_plan: itinerary
      };

      const saveResult = await tripsApi.save(payload);

      // 4. Set onboarding completed flag in local storage
      localStorage.setItem('voira_onboarding_completed', 'true');

      // 5. Navigate to Dashboard focused on this trip
      navigate('/dashboard/trip', { state: { trip: saveResult.trip } });
    } catch (err) {
      
      setError('Failed to deploy your onboarding trip sandbox.');
    } finally {
      setDeploying(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('voira_onboarding_completed', 'true');
    navigate('/planner');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col justify-center min-h-[85vh] font-sans">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 max-w-sm mx-auto w-full">
        {[1, 2, 3].map(num => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all ${
              step >= num 
                ? 'bg-primary border-primary text-warmWhite shadow-md shadow-primary/20'
                : 'bg-warmWhite border-stoneMuted dark:bg-dark-card dark:border-dark-border text-textSecondary'
            }`}>
              {step > num ? '✓' : num}
            </div>
            {num < 3 && (
              <div className={`w-16 h-0.5 mx-2 ${step > num ? 'bg-primary' : 'bg-stoneMuted dark:bg-dark-border'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-comfortable bg-coral/10 text-coral rounded-md border border-coral/20 max-w-md mx-auto mb-6 text-center text-xs font-semibold">
          {error}
        </div>
      )}

      {/* STEP 1: TRAVEL STYLES */}
      {step === 1 && (
        <div className="space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-coral uppercase tracking-widest">Preference Profile</span>
            <h2 className="text-3xl font-bold text-textPrimary dark:text-warmWhite tracking-tight">Choose Your Travel Mood</h2>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted max-w-md mx-auto leading-relaxed">
              Select one or more travel styles that represent how you like to explore the world. We customize everything around these.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto py-2">
            {STYLE_OPTIONS.map((style) => {
              const isSelected = selectedStyles.includes(style.id);
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleStyleToggle(style.id)}
                  className={`h-28 rounded-xl relative overflow-hidden text-left transition-all duration-300 flex items-end p-4 border-2 group select-none ${
                    isSelected ? 'border-coral shadow-md scale-[1.02]' : 'border-transparent hover:border-primary/50'
                  }`}
                  style={{
                    backgroundImage: `url(${style.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors pointer-events-none" />
                  {isSelected && <div className="absolute inset-0 bg-coral/20 pointer-events-none" />}
                  <div className="relative z-10 w-full flex justify-between items-center text-warmWhite pointer-events-none">
                    <span className="font-sans font-bold text-xs tracking-wider uppercase">{style.label.split(' ').slice(1).join(' ')}</span>
                    {isSelected && <CheckCircle2 className="w-4.5 h-4.5 text-coral shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center max-w-2xl mx-auto pt-6 border-t border-stoneMuted/40 dark:border-dark-border/40">
            <button onClick={handleSkip} className="text-xs text-textSecondary hover:underline">Skip Onboarding</button>
            <button
              onClick={handleNext}
              disabled={selectedStyles.length === 0}
              className="px-6 py-2.5 bg-primary text-warmWhite rounded-md font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ORIGIN & BUDGET */}
      {step === 2 && (
        <div className="space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-coral uppercase tracking-widest">Routing & Cost</span>
            <h2 className="text-3xl font-bold text-textPrimary dark:text-warmWhite tracking-tight">Set Your Defaults</h2>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted max-w-md mx-auto leading-relaxed">
              Help us detect your home terminal and budget bracket to optimize flight costs and lodging search recommendations.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-6 bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-xl p-comfortable shadow-sm text-left">
            {/* Origin City */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-textSecondary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Default Home City (Detected)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  placeholder="e.g. Delhi, New York"
                  className="w-full px-4 py-4 rounded-sm bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-sm font-semibold text-textPrimary dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider font-bold bg-successSage/15 text-successSage px-1.5 py-0.5 rounded">GPS OK</span>
              </div>
            </div>

            {/* Budget options */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-textSecondary flex items-center gap-2">
                <Compass className="w-4 h-4 text-coral" /> Target Budget Bracket
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Budget', 'Mid-Range', 'Luxury'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setBudgetRange(level)}
                    className={`py-3 rounded-md text-xs font-semibold transition-all border ${
                      budgetRange === level
                        ? 'bg-primary border-primary text-warmWhite shadow-xs'
                        : 'border-stoneMuted dark:border-dark-border hover:bg-stoneMuted/30 text-textSecondary'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center max-w-md mx-auto pt-6">
            <button
              onClick={handleBack}
              className="px-4 py-2.5 border border-stoneMuted dark:border-dark-border rounded-md font-semibold text-xs text-textSecondary flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-primary text-warmWhite rounded-md font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-primary/20"
            >
              <span>Review Suggestion</span> <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SUGGESTION */}
      {step === 3 && (
        <div className="space-y-8 animate-fade-in text-center">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-coral uppercase tracking-widest">Onboarding Match</span>
            <h2 className="text-3xl font-bold text-textPrimary dark:text-warmWhite tracking-tight">Your First Suggested Trip</h2>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted max-w-md mx-auto leading-relaxed">
              Based on your travel style choices, we matched you with a custom plan. Launch sandbox to preview the full itinerary.
            </p>
          </div>

          <div className="flex justify-center py-2">
            <DestinationCard
              name={recommendation.name}
              region={recommendation.country}
              price={`₹${recommendation.budget.toLocaleString()}`}
            />
          </div>

          <p className="text-xs text-textSecondary dark:text-dark-text-muted max-w-sm mx-auto leading-relaxed italic">
            "{recommendation.description}"
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto pt-6 border-t border-stoneMuted/40 dark:border-dark-border/40">
            <button
              onClick={handleBack}
              disabled={deploying}
              className="w-full sm:w-auto px-6 py-3 border border-stoneMuted dark:border-dark-border rounded-md font-semibold text-xs text-textSecondary flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> <span>Back</span>
            </button>

            <button
              onClick={handleDeployRecommendation}
              disabled={deploying}
              className="w-full sm:w-auto flex-1 px-8 py-3 bg-primary text-warmWhite rounded-md font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {deploying ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-stoneMuted border-t-white animate-spin" />
                  <span>Deploying sandbox...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-warningAmber animate-pulse" />
                  <span>Launch This Sandbox Itinerary</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={handleSkip}
              disabled={deploying}
              className="text-xs text-textSecondary hover:underline disabled:opacity-50"
            >
              Skip, take me to Planner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
