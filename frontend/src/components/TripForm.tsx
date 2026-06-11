import React, { useState } from 'react';
import { TripGenerateInput } from '../services/api';
import { MapPin, Calendar, Wallet, Users, Compass, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface TripFormProps {
  onSubmit: (data: TripGenerateInput) => void;
  loading: boolean;
}

const INTEREST_OPTIONS = [
  { id: 'beaches', label: '🏖️ Beaches' },
  { id: 'nightlife', label: '🍸 Nightlife' },
  { id: 'water_sports', label: '🏄 Water Sports' },
  { id: 'food', label: '🍕 Food & Dining' },
  { id: 'culture', label: '🏛️ Culture & Heritage' },
  { id: 'nature', label: '🌲 Nature & Wildlife' },
  { id: 'adventure', label: '⛰️ Adventure Sports' },
  { id: 'shopping', label: '🛍️ Shopping' },
  { id: 'relaxation', label: '🧘 Spa & Wellness' },
  { id: 'history', label: '🏰 History & Castles' },
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
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 border-2 ${
                isCompleted 
                  ? 'bg-primary border-primary text-warmWhite scale-105' 
                  : isActive 
                  ? 'bg-primary border-primary text-warmWhite scale-110 shadow-md shadow-primary/20' 
                  : 'bg-warmWhite border-stoneMuted dark:bg-dark-card dark:border-dark-border text-transparent'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-warmWhite" />
              ) : isActive ? (
                <div className="w-2.5 h-2.5 rounded-lg bg-warmWhite" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-lg bg-stoneMuted dark:bg-dark-muted" />
              )}
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
            className="w-full h-11 bg-primary text-warmWhite font-semibold rounded-sm hover:opacity-95 active:scale-[0.98] transition-all mt-4 flex items-center justify-center gap-2 text-sm"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleNext} className="space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Trip Duration (Days)
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setDays(Math.max(1, days - 1))}
                className="w-12 h-12 rounded-sm bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text flex items-center justify-center font-semibold text-lg transition-colors border border-stoneMuted/30 dark:border-dark-border"
              >
                -
              </button>
              <span className="text-2xl font-semibold w-12 text-center text-textPrimary dark:text-dark-text">
                {days}
              </span>
              <button
                type="button"
                onClick={() => setDays(days + 1)}
                className="w-12 h-12 rounded-sm bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text flex items-center justify-center font-semibold text-lg transition-colors border border-stoneMuted/30 dark:border-dark-border"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <Wallet className="w-4 h-4 text-successSage" /> Package Budget (INR)
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
                className="w-full px-4 py-4 rounded-sm bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-lg transition-all"
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
              className="w-1/3 h-11 bg-stoneMuted text-textPrimary hover:bg-opacity-90 active:scale-[0.98] font-semibold rounded-sm flex items-center justify-center gap-2 transition-all text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              className="w-2/3 h-11 bg-primary text-warmWhite hover:opacity-95 active:scale-[0.98] font-semibold rounded-sm flex items-center justify-center gap-2 transition-all text-sm"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-primary" /> Travel Interests (Select multiple)
            </label>
            <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`p-4 rounded-md border text-left text-xs font-semibold transition-all flex items-center justify-between select-none ${
                      isSelected
                        ? 'bg-primary border-primary text-warmWhite shadow-sm'
                        : 'bg-warmWhite hover:bg-stoneMuted border-stoneMuted text-textPrimary dark:bg-dark-card dark:border-dark-border dark:text-dark-text'
                    }`}
                  >
                    <span>{interest.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-warmWhite" />
                    )}
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
              className="w-1/3 h-11 bg-stoneMuted text-textPrimary hover:bg-opacity-90 active:scale-[0.98] font-semibold rounded-sm flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={loading || selectedInterests.length === 0}
              className="w-2/3 h-11 bg-primary text-warmWhite font-semibold rounded-sm active:scale-[0.98] transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 animate-shimmer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-lg border-2 border-warmWhite/30 border-t-white animate-spin" />
                  <span>Structuring Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-warningAmber" /> 
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
