import React, { useState } from 'react';
import { TripGenerateInput } from '../services/api';
import { MapPin, Calendar, Wallet, Users, Compass, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

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
      budget,
      days,
      interests: selectedInterests,
      travelers
    });
  };

  const renderProgressBar = () => {
    const pct = ((step - 1) / 2) * 100;
    return (
      <div className="w-full bg-slate-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-8">
        <div 
          className="bg-gradient-to-r from-brand to-accent h-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md p-8 rounded-3xl border border-slate-200/50 dark:border-neutral-800/40 shadow-xl relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full blur-xl -mr-6 -mt-6"></div>
      
      {renderProgressBar()}

      <div className="mb-6">
        <span className="text-xs font-bold text-brand uppercase tracking-wider">Step {step} of 3</span>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
          {step === 1 && "Where & when are we flying?"}
          {step === 2 && "What's the budget & duration?"}
          {step === 3 && "Tell us what you love!"}
        </h3>
      </div>

      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Source Location
            </label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. Delhi, Mumbai, New York"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 focus:ring-2 focus:ring-brand/50 focus:border-brand text-slate-900 dark:text-white focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-accent" /> Destination
            </label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Goa, Paris, Tokyo"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 focus:ring-2 focus:ring-brand/50 focus:border-brand text-slate-900 dark:text-white focus:outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <input
                type="date"
                required
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 focus:ring-2 focus:ring-brand/50 focus:border-brand text-slate-900 dark:text-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Travelers
              </label>
              <select
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 focus:ring-2 focus:ring-brand/50 focus:border-brand text-slate-900 dark:text-white focus:outline-none transition-all"
              >
                <option value={1}>1 Traveler (Solo)</option>
                <option value={2}>2 Travelers (Couple)</option>
                <option value={3}>3 Travelers</option>
                <option value={4}>4 Travelers (Family/Friends)</option>
                <option value={5}>5+ Travelers</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-brand text-white font-semibold rounded-xl hover:bg-brand-600 flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition-all mt-4"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleNext} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Trip Duration (Days)
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setDays(Math.max(1, days - 1))}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white flex items-center justify-center font-bold text-lg transition-colors"
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center text-slate-800 dark:text-white">
                {days}
              </span>
              <button
                type="button"
                onClick={() => setDays(days + 1)}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white flex items-center justify-center font-bold text-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-500" /> Approximate Budget (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-semibold text-lg">₹</span>
              <input
                type="number"
                required
                min={5000}
                max={5000000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 focus:ring-2 focus:ring-brand/50 focus:border-brand text-slate-900 dark:text-white focus:outline-none font-bold text-lg transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum suggested budget: ₹5,000. Recommended daily budget: ₹4,000 - ₹12,000.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-1/3 py-3.5 bg-slate-150 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              className="w-2/3 py-3.5 bg-brand text-white font-semibold rounded-xl hover:bg-brand-600 flex items-center justify-center gap-2 shadow-md shadow-brand/20 transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5 mb-2">
              <Compass className="w-3.5 h-3.5 text-indigo-500" /> Select Travel Interests
            </label>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-brand/10 border-brand text-brand dark:bg-brand/20'
                        : 'bg-slate-50/50 hover:bg-slate-100/50 dark:bg-neutral-850/50 dark:hover:bg-neutral-800/50 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>{interest.label}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-brand"></span>
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
              className="w-1/3 py-3.5 bg-slate-150 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="submit"
              disabled={loading || selectedInterests.length === 0}
              className="w-2/3 py-3.5 bg-gradient-to-r from-brand to-accent text-white font-bold rounded-xl hover:from-brand-600 hover:to-accent-600 flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:shadow-brand/35 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>Creating Magic...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse" /> Generate Travel Plan
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
