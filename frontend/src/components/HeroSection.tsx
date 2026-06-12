import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Globe, ChevronRight, MapPin, Mic, MicOff, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTripStore } from '../store/useTripStore';
import { parseNaturalLanguage } from '../utils/parser';

const PLACEHOLDERS = [
  '✈ Plan a honeymoon in Bali',
  '🏔 Create a budget trip to Manali',
  '🏖 Goa under ₹20,000',
  '🌍 Europe in 10 days'
];

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const setTripPrompt = useTripStore(state => state.setTripPrompt);
  const setTripData = useTripStore(state => state.setTripData);

  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Voice Search / Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Rotating placeholder effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem('voyara_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const addRecentSearch = (searchQuery: string) => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q.toLowerCase() !== cleanQuery.toLowerCase());
      const updated = [cleanQuery, ...filtered].slice(0, 5);
      localStorage.setItem('voyara_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearch = (e: React.MouseEvent, qToRemove: string) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(q => q !== qToRemove);
      localStorage.setItem('voyara_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please try Chrome or Safari.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Save recent search
    addRecentSearch(query);

    // Parse Natural Language
    const parsed = parseNaturalLanguage(query);

    // Save globally in Zustand store
    setTripPrompt(query);
    setTripData({
      destination: parsed.destination,
      budget: parsed.budget,
      duration: parsed.days,
      travelers: parsed.travelers,
      moods: parsed.interests,
      dates: parsed.dates,
      generatedItinerary: null // Reset itinerary for new generate run
    });

    // Navigate to planner page
    navigate('/planner');
  };

  return (
    <div className="relative overflow-hidden py-24 bg-gradient-mesh border-b border-slate-100">
      {/* Mesh gradients absolute backgrounds */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[rgba(124,58,237,0.06)] rounded-full blur-[120px] -z-10 animate-pulse-subtle" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[rgba(37,99,235,0.04)] rounded-full blur-[100px] -z-10" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-purple-50/10 text-purple-700 px-4 py-2 rounded-full text-xs font-semibold tracking-wide border border-purple-100 shadow-sm"
              style={{ backgroundColor: 'rgba(124, 58, 237, 0.05)', color: 'rgb(109, 40, 217)' }}
            >
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>AUTONOMOUS AI TRAVEL AGENT</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-bold text-5xl sm:text-6xl text-slate-900 tracking-tight leading-none"
            >
              Travel planning, <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold">
                reimagined.
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hero-subheadline text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans"
            >
              Voyara is your autonomous travel concierge. Describe your dream vacation in plain English, and our subagents will instantly build, optimize, and continuously monitor your itinerary, hotels, flights, and weather changes.
            </motion.p>

            {/* Active AI Search Bar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', delay: 0.3 }}
              className="space-y-4 max-w-xl mx-auto lg:mx-0"
            >
              <form 
                onSubmit={handleSearchSubmit}
                className="bg-white border border-slate-200 p-2.5 rounded-2xl shadow-lg shadow-slate-100/60 flex flex-row gap-3 hover:border-purple-300 transition-all group"
              >
                <div className="flex items-center gap-3 px-4 flex-grow py-2 md:py-0">
                  <Search className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  <div className="relative flex-grow h-8 flex items-center">
                    <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      required
                      className="bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full font-semibold relative z-10"
                    />
                    <AnimatePresence mode="wait">
                      {!query && (
                        <motion.span 
                          key={placeholderIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 0.5, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="absolute left-0 text-sm text-slate-400 font-normal select-none pointer-events-none"
                        >
                          {PLACEHOLDERS[placeholderIndex]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Voice Input Trigger */}
                {(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition ? (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-2 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${
                      isListening 
                        ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                        : 'border-slate-200 text-slate-500 hover:text-slate-950 bg-slate-50 hover:bg-slate-100'
                    }`}
                    title={isListening ? 'Listening... Click to stop' : 'Search by Voice'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                ) : null}

                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Plan Instantly</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              {/* Speech-to-Text active status */}
              {isListening && (
                <div className="text-[10px] font-bold text-red-600 tracking-wider flex items-center gap-1.5 justify-center lg:justify-start px-2 uppercase">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                  <span>Listening carefully... Speak now</span>
                </div>
              )}
            </motion.div>

            {/* Suggested Prompts helper chips */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start max-w-xl mx-auto lg:mx-0">
                <span className="text-xs text-slate-500 font-semibold py-1">Try:</span>
                {[
                  '5 days in Goa under 20k',
                  'Honeymoon in Bali',
                  'Tokyo solo 10 days'
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="text-xs bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-1 rounded-full transition-colors font-medium"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Recent Searches history chips */}
              {recentSearches.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start max-w-xl mx-auto lg:mx-0 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500 font-semibold py-1 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Recent Searches:
                  </span>
                  {recentSearches.map((p, idx) => (
                    <div
                      key={idx}
                      className="group relative flex items-center text-xs bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-full pl-3 pr-2.5 py-1 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setQuery(p)}
                        className="font-medium mr-1.5 hover:text-slate-900"
                      >
                        {p}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => clearRecentSearch(e, p)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Remove search"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Credibility metrics block */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-12 pt-10 max-w-md mx-auto lg:mx-0 border-t border-slate-200"
            >
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">125k+</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">Trips Optimized</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">180+</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">Cities Mapped</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">4.96★</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">Investor Rating</p>
              </div>
            </motion.div>
          </div>

          {/* Right Floating Previews Mockup (Airbnb / Skyscanner style) */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <motion.div 
              initial={{ opacity: 0, x: 40, rotate: 1 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative mx-auto w-full max-w-[400px] aspect-[4/5] bg-gradient-to-tr from-blue-500/5 via-purple-500/3 to-pink-500/5 rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col justify-between overflow-hidden backdrop-blur-3xl"
            >
              {/* Graphic background shapes */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-blue-500/5 rounded-full blur-3xl" />

              {/* Destination Tag */}
              <div className="flex justify-between items-start z-10">
                <div className="bg-white/90 backdrop-blur-md p-3 px-4 rounded-2xl border border-slate-100 shadow-md flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold tracking-wider uppercase">Active Agent</span>
                    <span className="text-xs font-bold text-slate-800">Bali, Indonesia</span>
                  </div>
                </div>
                
                <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] tracking-wider uppercase px-3.5 py-1.5 rounded-full border border-emerald-100 shadow-md" style={{ backgroundColor: 'rgb(236, 253, 245)', color: 'rgb(4, 120, 87)', borderColor: 'rgb(167, 243, 208)' }}>
                  Verified Route
                </span>
              </div>

              {/* Daily segment preview card */}
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-100 transform rotate-1 translate-x-3 z-10 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Day 2 • 09:30 AM</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">28°C Sunny</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">Tegalalang Rice Terraces Excursion</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  Explore cascading green hillsides, enjoy the iconic jungle swing, and enjoy coconut juice.
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Ubud</span>
                  <span className="font-bold text-pink-500 font-mono">Est: ₹800</span>
                </div>
              </motion.div>

              {/* Mini Budget breakdown card */}
              <motion.div 
                whileHover={{ scale: 1.03, y: -2 }}
                className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-100 transform -rotate-2 -translate-x-3 z-10 self-start w-5/6 space-y-3"
              >
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Cost Matrix Summary</span>
                <div className="flex justify-between items-end">
                  <span className="text-xl font-bold text-pink-500 font-mono">₹59,000</span>
                  <span className="text-[10px] text-slate-500 font-semibold">7 Days • 2 Guests</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style={{ width: '68%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                    <span>Flights &amp; Hotel (68%)</span>
                    <span>Activities (32%)</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <div id="features" />
    </div>
  );
};
