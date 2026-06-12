import React, { useState, useEffect } from 'react';
import { Plane, Circle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingStateProps {
  source?: string;
  destination?: string;
  budget?: number;
  days?: number;
  onFinished?: () => void;
  isApiReady?: boolean;
}

const FlightPathAnimation: React.FC = () => {
  return (
    <div className="flight-path-overlay">
      <div className="relative w-full max-w-2xl px-8 flex items-center justify-center">
        {/* SVG India crop */}
        <svg viewBox="650 80 150 250" className="w-full h-auto stroke-white fill-none overflow-visible">
          <path 
            d="M 720 100 L 780 120 L 770 200 L 730 240 L 680 180 L 700 120 Z" 
            stroke="#E8E6E1" 
            strokeWidth="0.5" 
            fill="none" 
            className="opacity-25" 
          />

          <defs>
            <mask id="flight-path-mask">
              <path 
                d="M 772 100 Q 640 150 738 220" 
                fill="none" 
                stroke="white" 
                strokeWidth="2.5"
                style={{
                  strokeDasharray: 300,
                  strokeDashoffset: 300,
                  animation: 'drawPath 1.2s ease-in-out 0.2s forwards'
                }}
              />
            </mask>
          </defs>

          <path 
            d="M 772 100 Q 640 150 738 220" 
            fill="none" 
            stroke="white" 
            strokeWidth="0.8" 
            strokeDasharray="2,2"
            mask="url(#flight-path-mask)"
          />

          <g transform="translate(772, 100)">
            <circle r="8" fill="#0A1628" stroke="white" strokeWidth="1" />
            <text x="12" y="4" fill="white" fontSize="12" fontFamily="Inter" fontWeight="bold" stroke="none" className="select-none">Delhi</text>
          </g>

          <g transform="translate(738, 220)">
            <circle r="8" fill="none" stroke="#7C3AED" strokeWidth="1" className="animate-ripple-1" style={{ transformOrigin: 'center' }} />
            <circle r="8" fill="none" stroke="#7C3AED" strokeWidth="1" className="animate-ripple-2" style={{ transformOrigin: 'center' }} />
            
            <circle r="8" fill="#0A1628" stroke="white" strokeWidth="1" />
            <text x="12" y="4" fill="white" fontSize="12" fontFamily="Inter" fontWeight="bold" stroke="none" className="select-none">Goa</text>
          </g>

          <g>
            <foreignObject width="16" height="16" x="-8" y="-8" className="overflow-visible">
              <Plane className="w-4 h-4 text-[#7C3AED] fill-[#7C3AED] -rotate-45 animate-pulse" />
            </foreignObject>
            <animateMotion 
              dur="1.2s" 
              repeatCount="1"
              fill="freeze"
              begin="0.2s"
              path="M 772 100 Q 640 150 738 220"
              rotate="auto"
            />
          </g>
        </svg>

        <style>{`
          @keyframes rippleRing {
            0% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          .animate-ripple-1 {
            animation: rippleRing 1s ease-out 1.4s infinite;
          }
          .animate-ripple-2 {
            animation: rippleRing 1s ease-out 1.8s infinite;
          }
          @keyframes drawPath {
            from { stroke-dashoffset: 300; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  source = 'Delhi',
  destination = 'Goa',
  budget = 30000,
  days = 5,
  onFinished,
  isApiReady = false,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showMap, setShowMap] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [thinkingLogs, setThinkingLogs] = useState<string[]>([]);

  const steps = [
    'Analyzing Request',
    'Finding Attractions',
    'Comparing Hotels',
    'Optimizing Budget',
    'Generating Final Plan'
  ];

  // Map steps to specific logs
  const logFeed: Record<number, string[]> = {
    0: [
      'Parsing natural language prompt parameters...',
      'Extracting destination constraints and travel moods...'
    ],
    1: [
      'Querying attractions index database for ' + destination + '...',
      'Found 42 attractions'
    ],
    2: [
      'Searching stays matching budget criteria...',
      'Found 18 hotels'
    ],
    3: [
      'Running budget cost optimization allocations...',
      'Budget optimized'
    ],
    4: [
      'Integrating day-by-day travel timeline nodes...',
      'Building itinerary',
      'Generating final plan details...'
    ]
  };

  useEffect(() => {
    const mapTimer = setTimeout(() => setShowMap(false), 2000);
    return () => clearTimeout(mapTimer);
  }, []);

  // Animate steps and logs sequentially
  useEffect(() => {
    // Total duration ~9 seconds (1.8s per step)
    const stepInterval = 1800;
    
    // Initial logs for step 0
    setThinkingLogs(logFeed[0]);

    const timer = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        setCompletedSteps(comp => [...comp, prev]);

        if (next >= steps.length) {
          clearInterval(timer);
          return steps.length - 1;
        }

        // Add corresponding logs
        if (logFeed[next]) {
          setThinkingLogs(prevLogs => [...prevLogs, ...logFeed[next]]);
        }
        return next;
      });
    }, stepInterval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const allStepsAnimated = completedSteps.length >= steps.length - 1;
    if (allStepsAnimated && isApiReady && onFinished) {
      const timeout = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onFinished, 400); // Wait for exit card transition
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [completedSteps, isApiReady, onFinished, steps.length]);

  const isFinalWaiting = completedSteps.length >= steps.length - 1 && !isApiReady;
  const progress = ((completedSteps.length + 1) / steps.length) * 100;

  return (
    <>
      {showMap && <FlightPathAnimation />}
      
      <div className={`fixed inset-0 z-50 bg-[#07080f] overflow-hidden flex flex-col items-center justify-center p-4 transition-all duration-500 ${fadeOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
        
        {/* Animated Background Mesh */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10 animate-pulse-subtle" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[90px] -z-10" />

        {/* Center Loading Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl flex flex-col"
        >
          {/* Animated Core Icon */}
          <div className="relative mb-6 mx-auto w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-purple-500/10 animate-ping" />
            <div className="absolute inset-1 rounded-2xl border-2 border-dashed border-purple-500/20 animate-spin-slow" />
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Plane className="-rotate-45 w-5 h-5 animate-pulse" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight text-center mb-1 font-display">
            Autonomous Agent Orchestration
          </h3>
          <p className="text-xs text-stone-400 text-center mb-8 font-medium">
            Deploying search subagents to structure your trip package.
          </p>

          {/* Stepper Timeline */}
          <div className="space-y-4 text-left mb-8">
            {steps.map((stepText, idx) => {
              const isCompleted = completedSteps.includes(idx);
              const isActive = activeStep === idx;
              const isPending = idx > activeStep;

              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-4 transition-all duration-300 ${
                    isPending ? 'opacity-25' : 'opacity-100'
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
                    {stepText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Horizontal Progress Bar */}
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6 relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* AI Thinking Feed Log */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-2xl h-36 overflow-y-auto font-mono text-[10px] text-stone-400 space-y-2 text-left scrollbar-hide">
            <div className="text-[9px] uppercase font-bold text-purple-400 tracking-wider mb-2 font-sans">
              Live Thinking Feed:
            </div>
            <AnimatePresence>
              {thinkingLogs.map((log, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-purple-500">✓</span>
                  <span>{log}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {isFinalWaiting && (
              <div className="text-blue-400 animate-pulse text-[9px] font-bold mt-2">
                Orchestrating response... Polishing itinerary costs...
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};
