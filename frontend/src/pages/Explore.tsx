import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripsApi } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { Button } from '../components/Button';
import { Compass, Sparkles, MapPin, Calendar, Heart, Search } from 'lucide-react';

interface DestinationResult {
  name: string;
  image: string;
  description: string;
  estimatedCost: number;
  bestSeason: string;
  moods: string[];
  matchScore: number;
}

export const Explore: React.FC = () => {
  const navigate = useNavigate();
  const { formatPrice, convertPrice } = useCurrency();

  // Search parameters
  const [budget, setBudget] = useState<number>(50000); // in INR
  const [duration, setDuration] = useState<number>(5);
  const [season, setSeason] = useState<string>('any');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  
  // Results states
  const [results, setResults] = useState<DestinationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const moodsList = ['Beaches', 'Culture', 'Adventure', 'Food', 'Nightlife', 'Relaxing'];

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleSearch = async (surprise: boolean = false) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        budget,
        season: season === 'any' ? undefined : season,
        duration,
        moods: selectedMoods,
        surprise_me: surprise,
      };
      const data = await tripsApi.explore(payload);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch destination recommendations.');
    } finally {
      setLoading(false);
    }
  };

  // Initial search on mount
  useEffect(() => {
    handleSearch(false);
  }, []);

  const selectDestination = (destName: string) => {
    // Navigate to planner page and pre-populate parameters
    navigate('/planner', {
      state: {
        prefilledDestination: destName,
        prefilledBudget: budget,
        prefilledDays: duration,
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      
      {/* Header section */}
      <div className="space-y-3 text-left">
        <h1 className="text-3xl sm:text-4xl font-sans font-semibold text-textPrimary dark:text-dark-text">
          Find Your Next Adventure
        </h1>
        <p className="text-sm text-textSecondary dark:text-dark-text-muted max-w-2xl leading-relaxed">
          Input your travel parameters and let our AI recommendations match your mood and budget to the perfect global destinations.
        </p>
      </div>

      {/* Input panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Search controls card */}
        <div className="lg:col-span-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 space-y-6 shadow-[var(--shadow-sm)]">
          <h3 className="font-semibold text-lg text-[var(--color-text-primary)] flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--color-primary)]" /> Filter Preferences
          </h3>

          <div className="space-y-4">
            {/* Budget range slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-[var(--color-text-secondary)]">
                <span>Budget (Total)</span>
                <span className="price text-[var(--color-accent)]">{formatPrice(budget)}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={250000}
                step={5000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-[var(--color-primary)] bg-[var(--color-bg-hover)] rounded-lg appearance-none h-1.5 focus:outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
                <span>{formatPrice(10000)}</span>
                <span>{formatPrice(250000)}</span>
              </div>
            </div>

            {/* Trip days duration */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-textSecondary dark:text-dark-text-muted">
                Trip Duration ({duration} Days)
              </label>
              <input
                type="range"
                min={3}
                max={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-primary bg-stoneMuted/50 dark:bg-dark-muted rounded-lg appearance-none h-1.5 focus:outline-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-textSecondary dark:text-dark-text-muted/75">
                <span>3 Days</span>
                <span>15 Days</span>
              </div>
            </div>

            {/* Season/Month selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-textSecondary dark:text-dark-text-muted">
                Preferred Travel Season
              </label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md bg-stoneMuted/30 dark:bg-dark-muted/30 border border-stoneMuted/50 dark:border-dark-border/50 text-textPrimary dark:text-warmWhite focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="any">Any Season</option>
                <option value="winter">Winter / Cool Weather</option>
                <option value="summer">Summer / Warm Sun</option>
                <option value="monsoon">Monsoon / Rainy</option>
                <option value="spring">Spring / Blossom</option>
                <option value="autumn">Autumn / Foliage</option>
              </select>
            </div>

            {/* Mood selector badges */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-textSecondary dark:text-dark-text-muted mb-2">
                Travel Mood & Vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {moodsList.map(mood => {
                  const active = selectedMoods.includes(mood);
                  return (
                    <button
                      key={mood}
                      onClick={() => toggleMood(mood)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-primary text-warmWhite border-primary shadow-xs'
                          : 'bg-transparent text-textSecondary dark:text-dark-text-muted border-stoneMuted/60 dark:border-dark-border/60 hover:bg-stoneMuted/30'
                      }`}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stoneMuted/40 dark:border-dark-border/40 flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => handleSearch(false)}
              disabled={loading}
              className="w-full justify-center"
            >
              Find Matching Trips
            </Button>
            <button
              onClick={() => handleSearch(true)}
              className="flex justify-center items-center gap-1.5 py-2 px-4 border border-coral text-coral hover:bg-coral/5 font-semibold text-xs rounded-sm transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 fill-coral" /> Surprise Me!
            </button>
          </div>
        </div>

        {/* Results grid */}
        <div className="lg:col-span-2">
          {error && (
            <div className="p-4 bg-primary/5 text-primary border border-primary/20 rounded-md text-sm font-semibold mb-6">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/45 dark:border-dark-border/45 rounded-xl h-[280px] animate-pulse space-y-4 p-4">
                  <div className="w-full h-1/2 bg-stoneMuted dark:bg-dark-muted rounded-lg" />
                  <div className="h-4 bg-stoneMuted dark:bg-dark-muted w-1/3 rounded-sm" />
                  <div className="h-3 bg-stoneMuted dark:bg-dark-muted w-2/3 rounded-sm" />
                  <div className="h-8 bg-stoneMuted dark:bg-dark-muted w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 bg-warmWhite dark:bg-dark-card rounded-xl border border-stoneMuted/60 dark:border-dark-border/60">
              <Compass className="w-12 h-12 text-textSecondary dark:text-dark-text-muted mx-auto opacity-50 mb-3" />
              <h4 className="font-semibold text-textPrimary dark:text-warmWhite text-base">No matches found</h4>
              <p className="text-xs text-textSecondary dark:text-dark-text-muted max-w-xs mx-auto mt-1 leading-relaxed">
                Try expanding your budget slider or choosing fewer mood filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {results.map((dest) => (
                <div 
                  key={dest.name} 
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all group flex flex-col justify-between h-[340px]"
                >
                  
                  {/* Image banner strip */}
                  <div className="h-[150px] relative overflow-hidden bg-[var(--color-bg-hover)]">
                    <img 
                      src={dest.image} 
                      alt={dest.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    
                    {/* Match Score pill */}
                    <span className="absolute top-3 right-3 bg-[var(--color-text-primary)]/85 backdrop-blur-xs text-[var(--color-primary-light)] font-mono font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-[var(--radius-xs)] border border-white/10 shadow-md">
                      ✨ {dest.matchScore}% Match
                    </span>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end p-4">
                      <div className="flex items-center gap-1.5 text-white">
                        <MapPin className="w-4 h-4 text-[var(--color-accent)]" />
                        <h4 className="destination-name text-white">{dest.name}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Card description details */}
                  <div className="p-comfortable flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                      {dest.description}
                    </p>

                    <div className="flex justify-between items-center text-[11px] font-semibold text-[var(--color-text-secondary)] border-t border-[var(--color-border-subtle)] pt-2 font-sans">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        <span>{dest.bestSeason}</span>
                      </div>
                      <div className="price text-[var(--color-accent)]">
                        Cost: {formatPrice(dest.estimatedCost)}
                      </div>
                    </div>

                    <button
                      onClick={() => selectDestination(dest.name)}
                      className="btn-primary w-full bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-primary)] hover:text-white"
                    >
                      Create Itinerary
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default Explore;
