import React, { useState } from 'react';
import { TripGenerateInput } from '../services/api';
import { MapPin, Calendar, Wallet, Users, Compass, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface TripFormProps {
  onSubmit: (data: TripGenerateInput) => void;
  loading: boolean;
}

const INTEREST_OPTIONS = [
  { id: 'beaches', label: '🏖️ Beaches', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80' },
  { id: 'nightlife', label: '🍸 Nightlife', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80' },
  { id: 'water_sports', label: '🏄 Water Sports', image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=400&q=80' },
  { id: 'food', label: '🍕 Food & Dining', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
  { id: 'culture', label: '🏛️ Culture & Heritage', image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=400&q=80' },
  { id: 'nature', label: '🌲 Nature & Wildlife', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80' },
  { id: 'adventure', label: '⛰️ Adventure Sports', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80' },
  { id: 'shopping', label: '🛍️ Shopping', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' },
  { id: 'relaxation', label: '🧘 Spa & Wellness', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80' },
  { id: 'history', label: '🏰 History & Castles', image: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=400&q=80' },
];

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, loading }) => {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState('Delhi');
  const [destination, setDestination] = useState('Goa');
  const [budget, setBudget] = useState<number>(30000);
  const [days, setDays] = useState<number>(5);
  const [dates, setDates] = useState('');
  const [travelers, setTravelers] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['beaches', 'nightlife', 'water_sports']);

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      source,
      destination,
      days,
      budget,
      travelers,
      interests: selectedInterests,
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-warmWhite dark:bg-dark-card border border-stoneMuted/50 dark:border-dark-border/40 rounded-lg p-comfortable shadow-sm">
      {/* Redesigned 3-Step Progress Indicator */}
      <div className="relative flex justify-between items-center mb-12 max-w-xs mx-auto">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-stoneMuted dark:bg-dark-muted -z-10">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
        {[1, 2, 3].map((num) => {
          const isCompleted = step > num;
          const isActive = step === num;
          return (
            <div 
              key={num} 
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-300 border-2 ${
                isCompleted 
                  ? 'bg-primary border-primary text-warmWhite scale-105' 
                  : isActive 
                  ? 'bg-primary border-primary text-warmWhite scale-110 shadow-md shadow-primary/20' 
                  : 'bg-warmWhite border-stoneMuted dark:bg-dark-card dark:border-dark-border'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-warmWhite" />
              ) : isActive ? (
                <div className="w-2.5 h-2.5 rounded-full bg-warmWhite" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mb-6">
        <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted">Step {step}</span>
        <h3 className="text-2xl font-semibold text-textPrimary dark:text-dark-text mt-1 tracking-tight">
          {step === 1 && "Routing & Travelers"}
          {step === 2 && "Package Cost & Duration"}
          {step === 3 && "Select Travel Interests"}
        </h3>
      </div>

      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Origin City
            </label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Delhi, Mumbai, New York"
              className="w-full px-4 py-4 rounded-sm bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-dark-text text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary placeholder:font-normal transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <MapPin className="w-4 h-4 text-coral" /> Destination City
            </label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Goa, Paris, Tokyo"
              className="w-full px-4 py-4 rounded-sm bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-dark-text text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary placeholder:font-normal transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
                <Calendar className="w-4 h-4 text-textSecondary" /> Start Date
              </label>
              <input
                type="date"
                required
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                className={`w-full px-4 py-4 rounded-sm bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-dark-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all ${!dates ? 'date-input-empty' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
                <Users className="w-4 h-4 text-textSecondary" /> Guest Count
              </label>
              <select
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                className="w-full px-4 py-4 rounded-sm bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-dark-text text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              >
                <option value={1}>1 Traveler (Solo)</option>
                <option value={2}>2 Travelers (Couple)</option>
                <option value={3}>3 Travelers</option>
                <option value={4}>4 Travelers (Family)</option>
                <option value={5}>5+ Group Travelers</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full h-11 mt-4"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-4 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Trip Duration (Days)
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setDays(Math.max(1, days - 1))}
                className="w-12 h-12 rounded-sm bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text flex items-center justify-center font-bold text-lg transition-colors border border-stoneMuted/30 dark:border-dark-border"
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center text-textPrimary dark:text-dark-text">
                {days}
              </span>
              <button
                type="button"
                onClick={() => setDays(days + 1)}
                className="w-12 h-12 rounded-sm bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text flex items-center justify-center font-bold text-lg transition-colors border border-stoneMuted/30 dark:border-dark-border"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[var(--color-success)]" /> Package Budget (INR)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={budget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(budget) : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setBudget(val ? Number(val) : 0);
                }}
                placeholder="e.g. ₹30,000"
                className="w-full px-4 py-4 rounded-sm bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-primary font-mono text-lg transition-all font-bold"
              />
            </div>
            <p className="text-xs text-textSecondary leading-normal">
              Minimum suggested budget: ₹5,000. Recommended daily budget: ₹4,000 - ₹12,000.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary w-1/3"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              className="btn-primary w-2/3 h-11"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-textSecondary dark:text-dark-text-muted flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-primary" /> Travel Interests (Select multiple)
            </label>
            <div className="grid grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1 scrollbar-thin py-1">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`h-[90px] rounded-lg relative overflow-hidden text-left transition-all duration-300 flex items-end p-3 border-2 group select-none ${
                      isSelected
                        ? 'border-[var(--color-accent)] shadow-md'
                        : 'border-stoneMuted/40 dark:border-dark-border/40 hover:border-primary/50'
                    }`}
                    style={{
                      backgroundImage: `url(${interest.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Base dark overlay */}
                    <div className="absolute inset-0 bg-black/45 group-hover:bg-black/35 transition-colors pointer-events-none" />

                    {/* Selected Coral Tint Overlay (20% opacity) */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[var(--color-accent)]/20 pointer-events-none" />
                    )}

                    {/* Interest Label Text */}
                    <div className="relative z-10 w-full flex justify-between items-center text-warmWhite pointer-events-none">
                      <span className="font-sans font-bold text-xs tracking-wider uppercase drop-shadow-sm">
                        {interest.label}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)] shrink-0 drop-shadow-sm" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="btn-secondary w-1/3 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={loading || selectedInterests.length === 0}
              className="btn-cta w-2/3 animate-shimmer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-lg border-2 border-warmWhite/30 border-t-white animate-spin" />
                  <span>Structuring Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-[var(--color-warning)]" /> 
                  <span>Generate Travel Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
