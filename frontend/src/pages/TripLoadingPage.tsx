import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Compass, Sparkles, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { tripsApi, TripGenerateInput } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTripStore } from '../store/useTripStore';

const STEPS = [
  { id: 1, label: 'Analyzing Travel Request', emoji: '✈️' },
  { id: 2, label: 'Finding Attractions', emoji: '🏝' },
  { id: 3, label: 'Comparing Hotels', emoji: '🏨' },
  { id: 4, label: 'Optimizing Budget', emoji: '💰' },
  { id: 5, label: 'Building Your Itinerary', emoji: '🗺' },
  { id: 6, label: 'Trip Ready', emoji: '✅' }
];

const THINKING_FEED_TEMPLATES = [
  'Parsing natural language prompt parameters...',
  'Extracting destination constraints and travel moods...',
  'Connecting to search subagents matrix...',
  'Querying attractions index database...',
  'Found 42 attractions matching your profile',
  'Searching stays matching budget criteria...',
  'Found 18 hotels with high location scores',
  'Scraping local food joints and top-rated restaurants...',
  'Found 24 restaurants matching dietary preference',
  'Running budget cost optimization allocations...',
  'Budget optimized with a 10% emergency buffer',
  'Monitoring regional weather and monsoon warnings...',
  'Weather checked: Outdoor/indoor events adapted',
  'Integrating day-by-day travel timeline nodes...',
  'Building itinerary structure...',
  'Finalizing personalized travel recommendations...'
];

export const TripLoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loginGuest } = useAuth();
  const { setGeneratedItinerary, setTripPrompt, setTripData } = useTripStore();

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);
  const [tickerMessage, setTickerMessage] = useState('Finding hidden gems...');
  const [timeLeft, setTimeLeft] = useState(10);
  const [error, setError] = useState('');

  const inputRef = useRef<TripGenerateInput | null>(null);
  const generationResultRef = useRef<any>(null);
  const apiCompletedRef = useRef(false);

  // Retrieve input parameters from state or Zustand store fallback
  useEffect(() => {
    const stateInput = location.state?.input as TripGenerateInput | null;
    const store = useTripStore.getState();

    if (stateInput) {
      inputRef.current = stateInput;
    } else if (store.destination) {
      inputRef.current = {
        source: 'Delhi',
        destination: store.destination,
        days: store.duration,
        budget: store.budget,
        travelers: store.travelers,
        interests: store.moods
      };
    } else {
      // No parameters found, redirect to planner
      navigate('/planner');
    }
  }, [location.state, navigate]);

  // Run the generation API call and login guest if not authenticated
  useEffect(() => {
    let isMounted = true;
    
    const runGeneration = async () => {
      if (!inputRef.current) return;
      
      try {
        // Authenticate guest if not logged in
        if (!isAuthenticated) {
          await loginGuest();
        }
        
        // Call backend API
        const generatedPlan = await tripsApi.generate(inputRef.current);
        if (isMounted) {
          generationResultRef.current = generatedPlan;
          apiCompletedRef.current = true;
        }
      } catch (err: any) {
        console.error('Generation API error:', err);
        const errMsg = err.response?.data?.detail || 'Failed to generate your trip plan. Please try again.';
        if (isMounted) {
          setError(errMsg);
        }
      }
    };

    // Delay slightly to allow loading animation to start
    const delayTimer = setTimeout(() => {
      runGeneration();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(delayTimer);
    };
  }, [isAuthenticated, loginGuest]);

  // 10 Second countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update ticker messages based on elapsed time and destination
  useEffect(() => {
    const dest = inputRef.current?.destination || 'your destination';
    const tickerTemplates = [
      `Analyzing travel request for ${dest}...`,
      `Finding hidden gems in ${dest}...`,
      `Comparing hotels and matching stays...`,
      `Scraping top-rated local restaurants in ${dest}...`,
      `Optimizing budget allocations and travel routes...`,
      `Creating unforgettable experiences for you...`
    ];

    const tickerTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * tickerTemplates.length);
      setTickerMessage(tickerTemplates[idx]);
    }, 1800);

    return () => clearInterval(tickerTimer);
  }, [tickerMessage]);

  // Animate Checklist Steps and Live Thinking Feed sequentially
  useEffect(() => {
    // We have 6 steps (0 to 5). Total countdown is 10s.
    // Step transitions happen roughly every 1.5 seconds.
    const stepInterval = 1500;
    
    // Step 0 logs initially
    setThinkingLogs([THINKING_FEED_TEMPLATES[0], THINKING_FEED_TEMPLATES[1]]);

    const stepTimer = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        setCompletedSteps(comp => [...comp, prev]);

        if (next >= STEPS.length) {
          clearInterval(stepTimer);
          return STEPS.length - 1;
        }

        // Add 2-3 new logs per step to populate the feed
        const logStartIdx = next * 2.5;
        const newLogs = THINKING_FEED_TEMPLATES.slice(logStartIdx, logStartIdx + 3);
        setThinkingLogs(prevLogs => [...prevLogs, ...newLogs]);

        return next;
      });
    }, stepInterval);

    return () => clearInterval(stepTimer);
  }, []);

  // Guard routing once loading finishes and API is complete
  useEffect(() => {
    const isReadyToRedirect = activeStep === STEPS.length - 1 && timeLeft === 0;
    
    if (error) {
      // Go back to planner and pass the error message
      navigate('/planner', { state: { error } });
    } else if (isReadyToRedirect) {
      if (apiCompletedRef.current && generationResultRef.current && inputRef.current) {
        // Save to Zustand store
        setGeneratedItinerary(generationResultRef.current);
        setTripData({
          destination: inputRef.current.destination,
          budget: inputRef.current.budget,
          duration: inputRef.current.days,
          travelers: inputRef.current.travelers,
          moods: inputRef.current.interests,
          activeTripId: 0
        });

        // Navigate to results dashboard
        navigate('/dashboard/trip', {
          state: {
            generatedPlan: generationResultRef.current,
            originalInput: inputRef.current
          }
        });
      } else {
        // API is taking longer than 10 seconds, add a buffer log
        setThinkingLogs(prev => [...prev, 'Still processing... Finalizing layout details...']);
      }
    }
  }, [activeStep, timeLeft, error, navigate, setGeneratedItinerary, setTripData]);

  // If the API call completes *after* the timer runs out, trigger redirect
  useEffect(() => {
    if (timeLeft === 0 && apiCompletedRef.current && generationResultRef.current && inputRef.current) {
      setGeneratedItinerary(generationResultRef.current);
      setTripData({
        destination: inputRef.current.destination,
        budget: inputRef.current.budget,
        duration: inputRef.current.days,
        travelers: inputRef.current.travelers,
        moods: inputRef.current.interests,
        activeTripId: 0
      });
      navigate('/dashboard/trip', {
        state: {
          generatedPlan: generationResultRef.current,
          originalInput: inputRef.current
        }
      });
    }
  }, [timeLeft, setGeneratedItinerary, setTripData, navigate]);

  // Circular progress math
  const maxTime = 10;
  const progressPercent = ((maxTime - timeLeft) / maxTime) * 100;
  const strokeDashoffset = 251.2 - (251.2 * progressPercent) / 100;

  // Particle list for animated canvas effect
  const particles = Array.from({ length: 15 });

  return (
    <div className="min-h-screen w-full bg-[#07080f] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Animated gradient mesh background */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 animate-pulse-subtle" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight + 100, 
              opacity: 0.1 + Math.random() * 0.4, 
              scale: 0.5 + Math.random() * 0.8 
            }}
            animate={{ 
              y: [null, -100], 
              x: [null, Math.random() * 50 - 25] 
            }}
            transition={{ 
              duration: 15 + Math.random() * 20, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
            className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
            style={{ filter: 'blur(1px)' }}
          />
        ))}
      </div>

      {/* Cinematic Center Loading Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col relative z-10"
      >
        
        {/* Core AI Avatar & SVG Progress Ring */}
        <div className="relative mb-8 mx-auto w-24 h-24 flex items-center justify-center">
          {/* Pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-purple-500/10 animate-ping" />
          
          {/* Rotating outer ring */}
          <div className="absolute inset-1 rounded-full border border-dashed border-purple-500/30 animate-spin-slow" />
          
          {/* SVG Progress Ring */}
          <svg className="absolute w-full h-full rotate-[-90deg]">
            <circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-white/5 fill-none"
              strokeWidth="3.5"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              className="stroke-purple-500 fill-none"
              strokeWidth="3.5"
              strokeDasharray="251.2"
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>

          {/* Glowing Avatar Center */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 z-10">
            <Compass className="-rotate-45 w-7 h-7 text-white" />
          </div>
        </div>

        {/* Header Titles */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-1.5 uppercase font-sans">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
            Autonomous Copilot Agent
          </h3>
          {/* Estimation ticker */}
          <div className="text-xs text-stone-400 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <span>Estimated completion time: </span>
            <span className="text-pink-400 font-mono font-bold">{timeLeft}s</span>
          </div>
        </div>

        {/* Ticker Sub-caption */}
        <div className="h-6 flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={tickerMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-semibold text-purple-300 italic tracking-wide text-center"
            >
              {tickerMessage}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Step Checklist Timeline */}
        <div className="space-y-3.5 mb-8">
          {STEPS.map((step, idx) => {
            const isCompleted = completedSteps.includes(idx);
            const isActive = activeStep === idx;
            const isPending = idx > activeStep;

            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-4 transition-all duration-300 ${
                  isPending ? 'opacity-20' : 'opacity-100'
                }`}
              >
                <div className="shrink-0 relative">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                      ✓
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  ) : (
                    <Circle className="w-5 h-5 text-stone-600" />
                  )}
                </div>
                
                <span className={`text-xs font-bold tracking-wide transition-colors ${
                  isActive ? 'text-purple-400' : 'text-stone-300'
                }`}>
                  {step.emoji} {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live AI Thinking Terminal Feed */}
        <div className="bg-black/60 border border-white/10 p-5 rounded-2xl h-40 overflow-y-auto font-mono text-[10px] text-stone-400 space-y-2 text-left scrollbar-hide">
          <div className="text-[9px] uppercase font-bold text-purple-400 tracking-wider mb-2 font-sans flex items-center justify-between border-b border-white/5 pb-1.5">
            <span>Live Agent Thinking logs:</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            {thinkingLogs.map((log, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-1.5 leading-relaxed"
              >
                <span className="text-purple-500 font-bold shrink-0">✓</span>
                <span>{log}</span>
              </motion.div>
            ))}
            {/* Blinking cursor */}
            <div className="flex items-center gap-1 text-[9px] text-purple-500 animate-pulse font-semibold mt-1">
              <span>✈ Connecting search subagents...</span>
              <span className="w-1 h-3 bg-purple-500 inline-block animate-ping" />
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default TripLoadingPage;
