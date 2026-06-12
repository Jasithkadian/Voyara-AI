import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TripForm } from '../components/TripForm';
import { LoadingState } from '../components/LoadingState';
import { tripsApi, TripGenerateInput, TripPlan } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTripStore } from '../store/useTripStore';
import { parseNaturalLanguage, ParsedTripParams } from '../utils/parser';
import { Compass, AlertCircle, MessageSquare, Sparkles, MapPin, Calendar, Wallet, Users, RefreshCw, ChevronRight } from 'lucide-react';

const INTEREST_LABELS: Record<string, string> = {
  beaches: '🏖️ Beaches',
  nightlife: '🍸 Nightlife',
  water_sports: '🏄 Water Sports',
  food: '🍕 Food & Dining',
  culture: '🏛️ Culture & Heritage',
  nature: '🌲 Nature & Wildlife',
  adventure: '⛰️ Adventure Sports',
  shopping: '🛍️ Shopping',
  relaxation: '🧘 Spa & Wellness',
  history: '🏰 History & Castles',
};

export const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loginGuest } = useAuth();
  
  // Zustand Store hooks
  const { 
    tripPrompt, destination, budget, duration, travelers, moods, dates,
    setTripPrompt, setTripData, setGeneratedItinerary
  } = useTripStore();

  const [loading, setLoading] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [error, setError] = useState('');
  
  const [plannerMode, setPlannerMode] = useState<'conversational' | 'wizard'>('conversational');
  const [nlQuery, setNlQuery] = useState('');
  const [parsedParams, setParsedParams] = useState<ParsedTripParams | null>(null);

  const apiResultRef = useRef<TripPlan | null>(null);
  const [activeInput, setActiveInput] = useState<TripGenerateInput | null>(null);

  // Listen to redirect errors (e.g., from loading screen failure)
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location.state]);

  // Background Auto-guest Login on mount
  useEffect(() => {
    const performAutoGuest = async () => {
      if (!isAuthenticated && !loading) {
        try {
          await loginGuest();
        } catch (err) {
          console.error("Background auto guest login failed:", err);
        }
      }
    };
    performAutoGuest();
  }, [isAuthenticated, loading, loginGuest]);

  // Sync state if coming from Homepage
  useEffect(() => {
    if (destination && !parsedParams && plannerMode === 'conversational') {
      setParsedParams({
        destination,
        days: duration,
        budget,
        travelers,
        interests: moods,
        dates: dates || 'Upcoming dates'
      });
      setNlQuery(tripPrompt);
    }
  }, [destination, duration, budget, travelers, moods, dates, tripPrompt, parsedParams, plannerMode]);

  const handleNlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    const parsed = parseNaturalLanguage(nlQuery);
    
    // Sync to store
    setTripPrompt(nlQuery);
    setTripData({
      destination: parsed.destination,
      budget: parsed.budget,
      duration: parsed.days,
      travelers: parsed.travelers,
      moods: parsed.interests,
      dates: parsed.dates
    });

    setParsedParams(parsed);
  };

  const handleConfirmedGenerate = () => {
    if (!parsedParams) return;

    const input: TripGenerateInput = {
      source: 'Delhi', // Default source city
      destination: parsedParams.destination,
      days: parsedParams.days,
      budget: parsedParams.budget,
      travelers: parsedParams.travelers,
      interests: parsedParams.interests,
    };

    // Store in Zustand
    setTripPrompt(nlQuery || input.destination + ' trip');
    setTripData({
      destination: input.destination,
      budget: input.budget,
      duration: input.days,
      travelers: input.travelers,
      moods: input.interests,
      dates: parsedParams.dates || 'Upcoming dates',
      generatedItinerary: null
    });

    // Navigate immediately to loading screen
    navigate('/planner/loading', { state: { input } });
  };

  const handleWizardSubmit = (data: TripGenerateInput) => {
    // Store in Zustand
    setTripPrompt(data.destination + ' trip');
    setTripData({
      destination: data.destination,
      budget: data.budget,
      duration: data.days,
      travelers: data.travelers,
      moods: data.interests,
      dates: 'Upcoming dates',
      generatedItinerary: null
    });

    // Navigate immediately to loading screen
    navigate('/planner/loading', { state: { input: data } });
  };

  const handleReset = () => {
    setParsedParams(null);
    setNlQuery('');
    useTripStore.getState().resetStore();
  };

  const toggleInterest = (id: string) => {
    if (!parsedParams) return;
    const updatedInterests = parsedParams.interests.includes(id)
      ? parsedParams.interests.filter(item => item !== id)
      : [...parsedParams.interests, id];

    setParsedParams({
      ...parsedParams,
      interests: updatedInterests
    });

    setTripData({ moods: updatedInterests });
  };

  const updateField = (field: keyof ParsedTripParams, value: any) => {
    if (!parsedParams) return;
    const updated = { ...parsedParams, [field]: value };
    setParsedParams(updated);
    
    setTripData({
      destination: updated.destination,
      budget: updated.budget,
      duration: updated.days,
      travelers: updated.travelers,
      moods: updated.interests,
      dates: updated.dates
    });
  };



  const currentStep = parsedParams ? 2 : 1;

  return (
    <div className="min-h-screen py-16 px-4 bg-[#0b0c16] text-white flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background glow animations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full max-w-2xl relative z-10 space-y-8">
        
        {/* Stepper Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/10 -z-10" />
            <motion.div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-blue-500 to-purple-600 -z-10" 
              initial={{ width: '0%' }}
              animate={{ width: currentStep === 1 ? '0%' : '50%' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />

            {[
              { step: 1, label: 'Prompt' },
              { step: 2, label: 'Customize' },
              { step: 3, label: 'Generate' }
            ].map((s) => {
              const isActive = currentStep === s.step;
              const isCompleted = currentStep > s.step;

              return (
                <div key={s.step} className="flex flex-col items-center space-y-2">
                  <motion.div 
                    layout
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110 shadow-lg shadow-purple-500/35 ring-4 ring-purple-500/20' 
                        : isCompleted
                        ? 'bg-purple-600 text-white'
                        : 'bg-stone-900 border border-white/10 text-stone-500'
                    }`}
                  >
                    {isCompleted ? '✓' : s.step}
                  </motion.div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${
                    isActive ? 'text-purple-400 font-extrabold' : isCompleted ? 'text-purple-300' : 'text-stone-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand/Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2.5 tracking-tight font-display">
            <Compass className="w-8 h-8 text-purple-500 animate-spin-slow" /> Voyara AI Travel Agent
          </h2>
          <p className="text-xs text-stone-400 mt-2 font-medium">
            Let artificial intelligence orchestrate your personal holiday package and budget.
          </p>
        </div>

        {/* Error messaging */}
        {error && (
          <div className="flex items-center gap-4 p-4 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-xl text-left animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <p className="text-xs sm:text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Mode Toggle Button */}
        {!parsedParams && (
          <div className="flex w-full md:max-w-md mx-auto bg-white/5 border border-white/10 p-1 rounded-xl shadow-lg">
            <button
              onClick={() => { setPlannerMode('conversational'); handleReset(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                plannerMode === 'conversational'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Conversational AI
            </button>
            
            <button
              onClick={() => setPlannerMode('wizard')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                plannerMode === 'wizard'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Structured Wizard
            </button>
          </div>
        )}

        {/* Step 1: Prompt Input Card */}
        {plannerMode === 'conversational' && !parsedParams && (
          <motion.form 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleNlSubmit} 
            className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-left backdrop-blur-xl"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Describe Your Travel Plan
              </label>
              <textarea
                rows={4}
                required
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="Try: 5 days in Goa for beaches and parties, ₹20,000, end of July"
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder:text-stone-500 placeholder:font-normal transition-all resize-none leading-relaxed shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={!nlQuery.trim()}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md shadow-purple-500/20 disabled:opacity-40"
            >
              <span>Extract Itinerary Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.form>
        )}

        {/* Step 2: Confirmation & Dynamic Summary Card */}
        {plannerMode === 'conversational' && parsedParams && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 text-left backdrop-blur-2xl relative"
          >
            {/* Dynamic Summary Card (Stripe/Airbnb Style) */}
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/10 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-400 block">Trip Summary</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-bold text-white leading-none">
                  <span className="text-blue-400 font-display text-lg">{parsedParams.destination}</span>
                  <span className="text-stone-600">•</span>
                  <span>{parsedParams.days} Days</span>
                  <span className="text-stone-600">•</span>
                  <span>₹{parsedParams.budget.toLocaleString('en-IN')}</span>
                  <span className="text-stone-600">•</span>
                  <span>{parsedParams.travelers} Guest{parsedParams.travelers > 1 ? 's' : ''}</span>
                </div>
                <div className="text-[10px] text-stone-400 font-medium pt-1">
                  Focus: {parsedParams.interests.map(i => INTEREST_LABELS[i] || i).join(' • ')}
                </div>
              </div>
              <button 
                onClick={handleReset}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 transition-colors uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-2 rounded-xl"
              >
                <RefreshCw className="w-3 h-3" /> Edit Prompt
              </button>
            </div>

            {/* Editable Form Inputs */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" /> Destination
                </label>
                <input
                  type="text"
                  required
                  value={parsedParams.destination}
                  onChange={(e) => updateField('destination', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" /> Target Dates Range
                </label>
                <input
                  type="text"
                  required
                  value={parsedParams.dates}
                  onChange={(e) => updateField('dates', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Budget (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={parsedParams.budget}
                    onChange={(e) => updateField('budget', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-mono font-bold text-pink-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> Duration (Days)
                  </label>
                  <div className="flex items-center space-x-2 border border-white/10 rounded-xl px-3 bg-white/5 h-[46px] justify-between">
                    <button 
                      type="button" 
                      onClick={() => updateField('days', Math.max(1, parsedParams.days - 1))}
                      className="font-bold text-sm text-stone-400 hover:text-white px-2"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold text-white">{parsedParams.days} Days</span>
                    <button 
                      type="button" 
                      onClick={() => updateField('days', parsedParams.days + 1)}
                      className="font-bold text-sm text-stone-400 hover:text-white px-2"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-stone-400" /> Travelers Count
                </label>
                <select
                  value={parsedParams.travelers}
                  onChange={(e) => updateField('travelers', Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value={1} className="bg-stone-900">1 Traveler (Solo)</option>
                  <option value={2} className="bg-stone-900">2 Travelers (Couple)</option>
                  <option value={3} className="bg-stone-900">3 Travelers</option>
                  <option value={4} className="bg-stone-900">4 Travelers (Family)</option>
                  <option value={5} className="bg-stone-900">5+ Group Travelers</option>
                </select>
              </div>

              <div className="space-y-3 relative z-10">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Travel Moods (Select Multiple)
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                  {Object.keys(INTEREST_LABELS).map((key) => {
                    const isSelected = parsedParams.interests.includes(key);
                    const label = INTEREST_LABELS[key];
                    const spaceIdx = label.indexOf(' ');
                    const emoji = spaceIdx !== -1 ? label.substring(0, spaceIdx) : '';
                    const text = spaceIdx !== -1 ? label.substring(spaceIdx + 1) : label;

                    return (
                      <motion.button
                        key={key}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleInterest(key)}
                        className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                            : 'border-white/10 text-stone-400 bg-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className={isSelected ? 'animate-bounce' : ''}>
                          {emoji}
                        </span>
                        <span>{text}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5">
              <button
                onClick={handleReset}
                className="w-full sm:w-1/3 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-stone-300 font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleConfirmedGenerate}
                className="w-full sm:flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-purple-500/25 transition-transform active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Generate My Itinerary</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Wizard fallback Mode */}
        {plannerMode === 'wizard' && (
          <TripForm onSubmit={handleWizardSubmit} loading={loading} />
        )}
      </div>
    </div>
  );
};
