import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TripForm } from '../components/TripForm';
import { LoadingState } from '../components/LoadingState';
import { tripsApi, TripGenerateInput, TripPlan } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTripStore } from '../store/useTripStore';
import { parseNaturalLanguage, ParsedTripParams } from '../utils/parser';
import { Compass, AlertCircle, MessageSquare, Sparkles, MapPin, Calendar, Wallet, Users, RefreshCw, ChevronRight, Bed, ChevronUp, Info, Utensils, Car } from 'lucide-react';
import { BudgetTierBadge } from '../components/BudgetTierBadge';
import { detectBudgetTier, getUpgradeNudge, getBudgetBreakdownEstimate } from '../utils/detectBudgetTier';
import { useToast } from '../context/ToastContext';

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

const getMonthNumber = (dateStr: string): number => {
  const s = dateStr.toLowerCase();
  if (s.includes('jan')) return 1;
  if (s.includes('feb')) return 2;
  if (s.includes('mar')) return 3;
  if (s.includes('apr')) return 4;
  if (s.includes('may')) return 5;
  if (s.includes('jun')) return 6;
  if (s.includes('jul')) return 7;
  if (s.includes('aug')) return 8;
  if (s.includes('sep')) return 9;
  if (s.includes('oct')) return 10;
  if (s.includes('nov')) return 11;
  if (s.includes('dec')) return 12;
  return new Date().getMonth() + 1;
};

const getLeadDays = (dateStr: string): number => {
  const s = dateStr.toLowerCase();
  const match = s.match(/in\s+(\d+)\s+day/);
  if (match) return parseInt(match[1]);
  if (s.includes('tomorrow')) return 1;
  if (s.includes('today')) return 0;
  return 30; // default 30 days lead time
};

interface BudgetFeedbackProps {
  budget: number;
  days: number;
  travelers: number;
  destination: string;
  dates: string;
}

const BudgetFeedbackSection: React.FC<BudgetFeedbackProps> = ({
  budget,
  days,
  travelers,
  destination,
  dates,
}) => {
  const travelMonth = getMonthNumber(dates);
  const bookingLeadDays = getLeadDays(dates);

  const tier = detectBudgetTier({
    totalBudget: budget,
    tripDays: days,
    travelerCount: travelers,
    destination,
    travelMonth,
    bookingLeadDays,
  });

  const nudge = getUpgradeNudge({
    totalBudget: budget,
    tripDays: days,
    travelerCount: travelers,
    destination,
    travelMonth,
    bookingLeadDays,
  });

  const breakdown = getBudgetBreakdownEstimate(tier, days, travelers);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Check island override
  const isIsland = tier.transportModes.length === 1 && tier.transportModes[0] === 'flight' && (tier.tierNumber === 1 || tier.tierNumber === 2);

  // Warnings
  const showOneDayWarning = days === 1 && tier.tierNumber === 1;
  const rawDaily = budget / (days || 1) / (travelers || 1);
  const showTightWarning = rawDaily < 500;

  // Colors for breakdown segments
  const colors = {
    stay: '#2563eb', // blue
    transport: '#0d9488', // teal
    food: '#7c3aed', // purple
    activities: '#d97706', // amber
    misc: '#94a3b8', // slate
  };

  // Friendly message based on tier
  let friendlyMsg = '';
  if (tier.tierNumber === 1) {
    friendlyMsg = 'We will find you buses and trains — stretching every rupee for the best experience.';
  } else if (tier.tierNumber === 2) {
    friendlyMsg = 'Sleeper trains recommended — great value and comfortable for this route.';
  } else if (tier.tierNumber === 3) {
    friendlyMsg = 'Mix of AC trains and budget flights depending on route and availability.';
  } else if (tier.tierNumber === 4) {
    friendlyMsg = 'Flights recommended for the best experience on this budget.';
  }

  // Recommended Stay label
  let recommendedStay = 'Budget Hotel';
  if (tier.tierNumber === 1) recommendedStay = 'Hostel Dorm Beds';
  else if (tier.tierNumber === 2) recommendedStay = 'Guesthouse / 2-Star Hotel';
  else if (tier.tierNumber === 3) recommendedStay = '3-Star Hotel';
  else if (tier.tierNumber === 4) recommendedStay = '4-Star or Above Luxury Stay';

  // Recommended Transport label
  let recommendedTrans = 'Flight';
  if (tier.tierNumber === 1) recommendedTrans = 'Bus only';
  else if (tier.tierNumber === 2) recommendedTrans = 'Train (Sleeper) / Bus';
  else if (tier.tierNumber === 3) recommendedTrans = 'Train (AC) / Budget Flight';
  else if (tier.tierNumber === 4) recommendedTrans = 'Flight only';

  if (isIsland) {
    recommendedTrans = 'Flight (Required)';
  }

  // Recommended Food label
  let recommendedFood = '₹300 - ₹800 per meal';
  if (tier.tierNumber === 1) recommendedFood = 'Street Food & Dhabas (under ₹150)';
  else if (tier.tierNumber === 2) recommendedFood = 'Local Restaurants (under ₹300)';
  else if (tier.tierNumber === 3) recommendedFood = 'Mid-range Restaurants (under ₹800)';
  else if (tier.tierNumber === 4) recommendedFood = 'Fine Dining & Rooftops (above ₹800)';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animation values
  const animationProps = prefersReducedMotion 
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2, ease: 'easeOut' } } as any;

  // Calculate percentages for horizontal progress bar
  const totalCost = breakdown.stay + breakdown.transport + breakdown.food + breakdown.activities + breakdown.miscellaneous;
  const stayPct = (breakdown.stay / (totalCost || 1)) * 100;
  const transPct = (breakdown.transport / (totalCost || 1)) * 100;
  const foodPct = (breakdown.food / (totalCost || 1)) * 100;
  const actPct = (breakdown.activities / (totalCost || 1)) * 100;
  const miscPct = (breakdown.miscellaneous / (totalCost || 1)) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tier.tierNumber}
        {...animationProps}
        className="mt-4 p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5 backdrop-blur-md"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
            Detected Budget Class
          </span>
          <BudgetTierBadge
            totalBudget={budget}
            tripDays={days}
            travelerCount={travelers}
            destination={destination}
            travelMonth={travelMonth}
            bookingLeadDays={bookingLeadDays}
          />
        </div>

        {/* Horizontal Progress Breakdown Bar */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
            Estimated Cost Breakdown (Daily)
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/5 border border-white/5">
            <div style={{ width: `${stayPct}%`, backgroundColor: colors.stay }} title={`Stay: ${formatCurrency(breakdown.stay)}`} />
            <div style={{ width: `${transPct}%`, backgroundColor: colors.transport }} title={`Transport: ${formatCurrency(breakdown.transport)}`} />
            <div style={{ width: `${foodPct}%`, backgroundColor: colors.food }} title={`Food: ${formatCurrency(breakdown.food)}`} />
            <div style={{ width: `${actPct}%`, backgroundColor: colors.activities }} title={`Activities: ${formatCurrency(breakdown.activities)}`} />
            <div style={{ width: `${miscPct}%`, backgroundColor: colors.misc }} title={`Misc: ${formatCurrency(breakdown.miscellaneous)}`} />
          </div>
          <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-stone-400 font-mono text-center">
            <div className="truncate" style={{ color: colors.stay }}>Stay<span className="block font-normal mt-0.5 text-white">{formatCurrency(breakdown.stay)}</span></div>
            <div className="truncate" style={{ color: colors.transport }}>Transit<span className="block font-normal mt-0.5 text-white">{formatCurrency(breakdown.transport)}</span></div>
            <div className="truncate" style={{ color: colors.food }}>Food<span className="block font-normal mt-0.5 text-white">{formatCurrency(breakdown.food)}</span></div>
            <div className="truncate" style={{ color: colors.activities }}>Act<span className="block font-normal mt-0.5 text-white">{formatCurrency(breakdown.activities)}</span></div>
            <div className="truncate" style={{ color: colors.misc }}>Misc<span className="block font-normal mt-0.5 text-white">{formatCurrency(breakdown.miscellaneous)}</span></div>
          </div>
        </div>

        {/* Details Rows */}
        <div className="space-y-2.5 pt-1 border-t border-white/5 text-xs text-stone-300">
          <div className="flex items-center gap-2">
            <Car size={14} className="text-teal-400 shrink-0" />
            <span className="font-semibold text-stone-400 w-16 shrink-0">Transit:</span>
            <span>{recommendedTrans}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bed size={14} className="text-blue-400 shrink-0" />
            <span className="font-semibold text-stone-400 w-16 shrink-0">Stay:</span>
            <span>{recommendedStay}</span>
          </div>
          <div className="flex items-center gap-2">
            <Utensils size={14} className="text-purple-400 shrink-0" />
            <span className="font-semibold text-stone-400 w-16 shrink-0">Dining:</span>
            <span>{recommendedFood}</span>
          </div>
        </div>

        {/* Tier friendly message */}
        <p className="text-xs text-stone-400 italic pt-1 leading-relaxed border-t border-white/5">
          "{friendlyMsg}"
        </p>

        {/* Island Override Alert */}
        {isIsland && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed flex items-start gap-2 animate-fade-in">
            <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
            <span>Flights are required for this destination — no surface transport available regardless of budget.</span>
          </div>
        )}

        {/* 1-day backpacker trip warning */}
        {showOneDayWarning && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2 animate-fade-in">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-400" />
            <span>Single day backpacker trips can be very tight. Consider adding a day or increasing your budget slightly.</span>
          </div>
        )}

        {/* under 500 per day warning */}
        {showTightWarning && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed flex items-start gap-2 animate-fade-in">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-400" />
            <span>This budget may be very tight for a comfortable trip. We recommend at least ₹1,500 per person per day for a basic comfortable experience.</span>
          </div>
        )}

        {/* Upgrade Nudge */}
        {nudge && (
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] leading-relaxed flex items-start gap-2 shadow-inner animate-fade-in">
            <ChevronUp size={14} className="shrink-0 mt-0.5 text-purple-400 animate-bounce" />
            <span>{nudge}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
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

  const prevTierRef = useRef<number | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (parsedParams) {
      const travelMonth = getMonthNumber(parsedParams.dates);
      const bookingLeadDays = getLeadDays(parsedParams.dates);
      const tier = detectBudgetTier({
        totalBudget: parsedParams.budget,
        tripDays: parsedParams.days,
        travelerCount: parsedParams.travelers,
        destination: parsedParams.destination,
        travelMonth,
        bookingLeadDays
      });

      if (prevTierRef.current !== null && prevTierRef.current !== tier.tierNumber) {
        // Announcement text
        let recommendedStay = 'Budget Hotel';
        if (tier.tierNumber === 1) recommendedStay = 'Hostel Dorm Beds';
        else if (tier.tierNumber === 2) recommendedStay = 'Guesthouse / 2-Star Hotel';
        else if (tier.tierNumber === 3) recommendedStay = '3-Star Hotel';
        else if (tier.tierNumber === 4) recommendedStay = '4-Star or Above Luxury Stay';

        const transportLabel = tier.transportModes.join(' or ');
        const announceText = `Budget updated. Now showing ${tier.tierName} tier. Recommended transport: ${transportLabel}. Recommended stay: ${recommendedStay}.`;
        setSrAnnouncement(announceText);

        // Toast notification
        let toastMsg = '';
        if (tier.tierNumber > prevTierRef.current) {
          if (tier.tierNumber === 2) toastMsg = "Budget updated — switching to train recommendations.";
          if (tier.tierNumber === 3) toastMsg = "Budget updated — AC trains and flights now available.";
          if (tier.tierNumber === 4) toastMsg = "Budget updated — flights recommended for this route.";
        } else {
          toastMsg = `Budget reduced — adjusting to ${tier.tierName} recommendations.`;
        }
        if (toastMsg) {
          showToast(toastMsg, 'info');
        }
      }
      prevTierRef.current = tier.tierNumber;
    }
  }, [parsedParams?.budget, parsedParams?.days, parsedParams?.travelers, parsedParams?.destination, parsedParams?.dates]);

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
      {/* Visually hidden screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>
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
                </select>
              </div>

              <BudgetFeedbackSection
                budget={parsedParams.budget}
                days={parsedParams.days}
                travelers={parsedParams.travelers}
                destination={parsedParams.destination}
                dates={parsedParams.dates}
              />

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
