import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripForm } from '../components/TripForm';
import { LoadingState } from '../components/LoadingState';
import { tripsApi, TripGenerateInput, TripPlan } from '../services/api';
import { Compass, AlertCircle, MessageSquare, CheckCircle, Sparkles, MapPin, Calendar, Wallet, Users, RefreshCw, ChevronRight } from 'lucide-react';

interface ParsedTripParams {
  destination: string;
  days: number;
  budget: number;
  travelers: number;
  interests: string[];
  dates: string;
}

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

// Conversational parser function
function parseNaturalLanguage(text: string): ParsedTripParams {
  const t = text.toLowerCase();
  
  // 1. Extract Destination
  let destination = 'Goa';
  const destMatch = text.match(/(?:in|to|visit|go)\s+([A-Z][a-zA-Z\s]{1,15})(?:\s+for|\s+with|\s+under|,|\.|$)/i);
  if (destMatch && destMatch[1]) {
    destination = destMatch[1].trim();
  } else {
    const commonCities = ['goa', 'bali', 'dubai', 'switzerland', 'japan', 'tokyo', 'delhi', 'mumbai', 'paris', 'london', 'new york'];
    for (const city of commonCities) {
      if (t.includes(city)) {
        destination = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
  }

  // 2. Extract Duration (Days)
  let days = 5;
  const daysMatch = t.match(/(\d+)\s*(?:day|night)/);
  if (daysMatch && daysMatch[1]) {
    days = parseInt(daysMatch[1], 10);
  } else if (t.includes('week')) {
    days = 7;
  }

  // 3. Extract Budget
  let budget = 30000;
  const budgetMatch = t.match(/(?:₹|rs\.?|inr|)\s*(\d{1,3}(?:,\d{3})*|\d+)\s*(k|thousand|)/i);
  if (budgetMatch && budgetMatch[1]) {
    const rawVal = budgetMatch[1].replace(/,/g, '');
    let val = parseInt(rawVal, 10);
    const suffix = (budgetMatch[2] || '').toLowerCase();
    if (suffix === 'k') {
      val *= 1000;
    }
    if (val >= 2000) {
      budget = val;
    }
  }

  // 4. Extract Travelers
  let travelers = 1;
  if (t.includes('couple') || t.includes('honeymoon')) {
    travelers = 2;
  } else if (t.includes('family') || t.includes('group')) {
    travelers = 4;
  } else {
    const travelersMatch = t.match(/(\d+)\s*(?:traveler|guest|people|person|friend)/);
    if (travelersMatch && travelersMatch[1]) {
      travelers = parseInt(travelersMatch[1], 10);
    }
  }

  // 5. Extract Interests
  const interests: string[] = [];
  const interestMapping: Record<string, string> = {
    beach: 'beaches',
    sea: 'beaches',
    coast: 'beaches',
    nightlife: 'nightlife',
    party: 'nightlife',
    club: 'nightlife',
    bar: 'nightlife',
    water: 'water_sports',
    surf: 'water_sports',
    dive: 'water_sports',
    food: 'food',
    dining: 'food',
    eat: 'food',
    culture: 'culture',
    museum: 'culture',
    nature: 'nature',
    wildlife: 'nature',
    jungle: 'nature',
    adventure: 'adventure',
    trek: 'adventure',
    hike: 'adventure',
    climb: 'adventure',
    shop: 'shopping',
    relax: 'relaxation',
    spa: 'relaxation',
    wellness: 'relaxation',
    history: 'history',
    castle: 'history'
  };

  Object.keys(interestMapping).forEach((keyword) => {
    if (t.includes(keyword)) {
      const id = interestMapping[keyword];
      if (!interests.includes(id)) {
        interests.push(id);
      }
    }
  });

  if (interests.length === 0) {
    interests.push('beaches');
  }

  // 6. Extract Dates info
  let dates = 'end of July';
  const dateMatch = text.match(/(?:in|for|at|end of)\s+([A-Za-z]+\s*\d*)/i);
  if (dateMatch && dateMatch[1]) {
    dates = dateMatch[1].trim();
  }

  return { destination, days, budget, travelers, interests, dates };
}

export const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [error, setError] = useState('');
  
  // Navigation / input mode toggle
  const [plannerMode, setPlannerMode] = useState<'conversational' | 'wizard'>('conversational');
  const [nlQuery, setNlQuery] = useState('');
  const [parsedParams, setParsedParams] = useState<ParsedTripParams | null>(null);

  const apiResultRef = useRef<TripPlan | null>(null);
  const [activeInput, setActiveInput] = useState<TripGenerateInput | null>(null);

  const handleNlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    const parsed = parseNaturalLanguage(nlQuery);
    setParsedParams(parsed);
  };

  const handleConfirmedGenerate = async () => {
    if (!parsedParams) return;
    
    const input: TripGenerateInput = {
      source: 'Delhi', // Default source city
      destination: parsedParams.destination,
      days: parsedParams.days,
      budget: parsedParams.budget,
      travelers: parsedParams.travelers,
      interests: parsedParams.interests,
    };

    setActiveInput(input);
    setLoading(true);
    setIsApiReady(false);
    setError('');

    try {
      const generatedPlan = await tripsApi.generate(input);
      apiResultRef.current = generatedPlan;
      setIsApiReady(true);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to generate your trip plan. Please try again.');
      setLoading(false);
    }
  };

  const handleWizardSubmit = async (data: TripGenerateInput) => {
    setActiveInput(data);
    setLoading(true);
    setIsApiReady(false);
    setError('');

    try {
      const generatedPlan = await tripsApi.generate(data);
      apiResultRef.current = generatedPlan;
      setIsApiReady(true);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to generate your trip plan. Please try again.');
      setLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    if (apiResultRef.current && activeInput) {
      navigate('/dashboard/trip', { 
        state: { 
          generatedPlan: apiResultRef.current, 
          originalInput: activeInput 
        } 
      });
    }
  };

  const toggleInterest = (id: string) => {
    if (!parsedParams) return;
    setParsedParams({
      ...parsedParams,
      interests: parsedParams.interests.includes(id)
        ? parsedParams.interests.filter(item => item !== id)
        : [...parsedParams.interests, id]
    });
  };

  if (loading) {
    return (
      <LoadingState 
        source={activeInput?.source || 'Delhi'}
        destination={activeInput?.destination || 'Goa'}
        budget={activeInput?.budget || 30000}
        days={activeInput?.days || 5}
        isApiReady={isApiReady}
        onFinished={handleLoadingComplete}
      />
    );
  }

  return (
    <div className="min-h-[85vh] py-16 px-4 bg-gradient-mesh flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-textPrimary dark:text-warmWhite flex items-center justify-center gap-2 tracking-tight">
            <Compass className="w-8 h-8 text-primary animate-spin-slow" /> voira AI Trip Planner
          </h2>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-2">
            Let artificial intelligence design your custom holiday itinerary and budget.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-4 p-4 bg-coral dark:bg-coral/25 text-coral dark:text-coral border border-coral dark:border-coral/45 rounded-lg text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Toggle Mode Tab Bar */}
        <div className="flex w-full md:max-w-md mx-auto mb-8 bg-stoneMuted/30 dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 p-1.5 rounded-lg">
          <button
            onClick={() => { setPlannerMode('conversational'); setParsedParams(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
              plannerMode === 'conversational'
                ? 'bg-primary text-warmWhite shadow-xs'
                : 'text-textSecondary hover:text-textPrimary dark:text-dark-text-muted'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Conversational AI
          </button>
          
          <button
            onClick={() => setPlannerMode('wizard')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
              plannerMode === 'wizard'
                ? 'bg-primary text-warmWhite shadow-xs'
                : 'text-textSecondary hover:text-textPrimary dark:text-dark-text-muted'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Structured Wizard
          </button>
        </div>

        {/* CONVERSATIONAL MODE */}
        {plannerMode === 'conversational' && (
          <div className="w-full">
            {!parsedParams ? (
              <form onSubmit={handleNlSubmit} className="mobile-focus-container bg-warmWhite dark:bg-dark-card border border-stoneMuted/50 dark:border-dark-border/40 rounded-xl p-comfortable shadow-sm space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Describe Your Travel Plan
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={nlQuery}
                    onChange={(e) => setNlQuery(e.target.value)}
                    placeholder="Try: 5 days in Goa for beaches and parties, ₹30,000, end of July"
                    className="w-full h-[120px] md:h-auto px-4 py-4 rounded-lg bg-warmWhite dark:bg-dark-elevated border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-dark-text text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary placeholder:font-normal transition-all resize-none leading-relaxed shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!nlQuery.trim()}
                  className="w-full h-[52px] md:h-11 bg-primary text-warmWhite font-semibold rounded-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs shadow-sm shadow-primary/25 disabled:opacity-50"
                >
                  <span>Parse My Itinerary Idea</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              // CONFIRMATION CARD (Editable parameters)
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-md)] space-y-6 text-left animate-fade-in">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]">
                  <h3 className="font-bold text-[var(--text-sm)] text-[var(--color-text-primary)] uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-[var(--color-success)]" /> Confirm Extracted Details
                  </h3>
                  <button 
                    onClick={() => setParsedParams(null)}
                    className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:underline font-bold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Edit Prompt
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Destination */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Destination
                    </label>
                    <input
                      type="text"
                      required
                      value={parsedParams.destination}
                      onChange={(e) => setParsedParams({ ...parsedParams, destination: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-hover)] text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  {/* Dates / Months */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Target Dates Range
                    </label>
                    <input
                      type="text"
                      required
                      value={parsedParams.dates}
                      onChange={(e) => setParsedParams({ ...parsedParams, dates: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-hover)] text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  {/* Budget & Days Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-[var(--color-success)]" /> Budget (INR)
                      </label>
                      <input
                        type="number"
                        required
                        value={parsedParams.budget}
                        onChange={(e) => setParsedParams({ ...parsedParams, budget: Number(e.target.value) })}
                        className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-hover)] text-[var(--text-sm)] font-mono font-semibold text-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-primary)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" /> Duration (Days)
                      </label>
                      <div className="flex items-center space-x-2 border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 bg-[var(--color-bg-hover)] h-[38px] justify-between">
                        <button 
                          type="button" 
                          onClick={() => setParsedParams({ ...parsedParams, days: Math.max(1, parsedParams.days - 1) })}
                          className="font-bold text-[var(--text-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] px-2"
                        >
                          -
                        </button>
                        <span className="text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)]">{parsedParams.days} Days</span>
                        <button 
                          type="button" 
                          onClick={() => setParsedParams({ ...parsedParams, days: parsedParams.days + 1 })}
                          className="font-bold text-[var(--text-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] px-2"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Travelers select */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> Travelers count
                    </label>
                    <select
                      value={parsedParams.travelers}
                      onChange={(e) => setParsedParams({ ...parsedParams, travelers: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-hover)] text-[var(--text-sm)] font-semibold text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                      <option value={1}>1 Traveler (Solo)</option>
                      <option value={2}>2 Travelers (Couple)</option>
                      <option value={3}>3 Travelers</option>
                      <option value={4}>4 Travelers (Family)</option>
                      <option value={5}>5+ Group Travelers</option>
                    </select>
                  </div>

                  {/* Moods/Interests selections */}
                  <div className="space-y-2 relative z-10">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      Travel Moods (Select Multiple)
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {Object.keys(INTEREST_LABELS).map((key) => {
                        const isSelected = parsedParams.interests.includes(key);
                        const label = INTEREST_LABELS[key];
                        const spaceIdx = label.indexOf(' ');
                        const emoji = spaceIdx !== -1 ? label.substring(0, spaceIdx) : '';
                        const text = spaceIdx !== -1 ? label.substring(spaceIdx + 1) : label;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleInterest(key)}
                            className={`interest-chip px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                              isSelected
                                ? 'selected border-[var(--color-primary)] text-white'
                                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                          >
                            <span className="relative z-10 flex items-center gap-1">
                              <span className={isSelected ? 'emoji-bounce' : ''}>
                                {emoji}
                              </span>
                              <span> {text}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                 <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-[var(--color-border-subtle)] mt-6">
                   <button
                     onClick={() => setParsedParams(null)}
                     className="btn-secondary w-full md:w-1/3 h-[52px] md:h-11 justify-center flex items-center gap-2"
                   >
                     Reset
                   </button>
                   <button
                     onClick={handleConfirmedGenerate}
                     className="btn-cta w-full md:flex-1 h-[52px] md:h-11 justify-center"
                   >
                     <Sparkles className="w-4 h-4 text-white" />
                     <span>Generate My Itinerary</span>
                   </button>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* WIZARD MODE */}
        {plannerMode === 'wizard' && (
          <TripForm onSubmit={handleWizardSubmit} loading={loading} />
        )}
      </div>
    </div>
  );
};
