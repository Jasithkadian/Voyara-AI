import React, { useState, useEffect } from 'react';
import { Plane, Circle } from 'lucide-react';

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
        {/* SVG Viewport: 650 80 150 250 (Scaled crop of India region) */}
        <svg viewBox="650 80 150 250" className="w-full h-auto stroke-white fill-none overflow-visible">
          {/* India Outline: Subtle gray path */}
          <path 
            d="M 720 100 L 780 120 L 770 200 L 730 240 L 680 180 L 700 120 Z" 
            stroke="#E8E6E1" 
            strokeWidth="0.5" 
            fill="none" 
            className="opacity-25" 
          />

          {/* Dotted path animation mask */}
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

          {/* Dotted path (Delhi to Goa) revealed by mask */}
          <path 
            d="M 772 100 Q 640 150 738 220" 
            fill="none" 
            stroke="white" 
            strokeWidth="0.8" 
            strokeDasharray="2,2"
            mask="url(#flight-path-mask)"
          />

          {/* Delhi Pin: 8px radius navy fill */}
          <g transform="translate(772, 100)">
            <circle r="8" fill="#0A1628" stroke="white" strokeWidth="1" />
            <text x="12" y="4" fill="white" fontSize="12" fontFamily="DM Sans" fontWeight="bold" stroke="none" className="select-none">Delhi</text>
          </g>

          {/* Goa Pin: 8px radius navy fill + Ripple Ping on arrival (at 1.4s) */}
          <g transform="translate(738, 220)">
            {/* Ripple rings: scale 1 to 2.5, opacity 0.6 to 0, staggered 400ms */}
            <circle r="8" fill="none" stroke="#FF5733" strokeWidth="1" className="animate-ripple-1" style={{ transformOrigin: 'center' }} />
            <circle r="8" fill="none" stroke="#FF5733" strokeWidth="1" className="animate-ripple-2" style={{ transformOrigin: 'center' }} />
            
            <circle r="8" fill="#0A1628" stroke="white" strokeWidth="1" />
            <text x="12" y="4" fill="white" fontSize="12" fontFamily="DM Sans" fontWeight="bold" stroke="none" className="select-none">Goa</text>
          </g>

          {/* Plane Icon: coral plane sliding along path */}
          <g>
            <foreignObject width="16" height="16" x="-8" y="-8" className="overflow-visible">
              <Plane className="w-4 h-4 text-[#FF5733] fill-[#FF5733] -rotate-45" />
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

const DrawnCheckmark: React.FC = () => (
  <svg className="checkmark-draw w-5 h-5 text-[var(--color-success)]" viewBox="0 0 52 52">
    <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
  </svg>
);

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

  const formattedBudget = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(budget);

  const steps = [
    `Searching flights from ${source} to ${destination}...`,
    `Finding premium hotels within ${formattedBudget}...`,
    `Building your ${days}-day custom itinerary...`,
    `Checking local weather alerts for ${destination}: monsoon adjustment checked...`,
  ];

  useEffect(() => {
    const mapTimer = setTimeout(() => setShowMap(false), 1800);
    return () => clearTimeout(mapTimer);
  }, []);

  useEffect(() => {
    // Run each step for 3.5 seconds
    const stepInterval = 3500;

    const timer = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        
        // Mark previous step as completed
        setCompletedSteps(comp => [...comp, prev]);

        if (next >= steps.length) {
          clearInterval(timer);
          return steps.length - 1;
        }
        return next;
      });
    }, stepInterval);

    return () => clearInterval(timer);
  }, [steps.length]);

  useEffect(() => {
    const allStepsAnimated = completedSteps.length >= steps.length - 1;
    if (allStepsAnimated && isApiReady && onFinished) {
      const timeout = setTimeout(() => {
        setFadeOut(true);
        setTimeout(onFinished, 300); // Wait for exit card transition
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [completedSteps, isApiReady, onFinished, steps.length]);

  const isFinalWaiting = completedSteps.length >= steps.length - 1 && !isApiReady;
  const progress = (completedSteps.length / steps.length) * 100;
  const isComplete = completedSteps.length >= steps.length - 1 && isApiReady;

  return (
    <>
      {showMap && <FlightPathAnimation />}
      
      <div className={`fixed inset-0 z-50 bg-[var(--color-bg-page)] overflow-hidden flex flex-col transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <style>{`
          @keyframes stepIn {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fillDown {
            to { height: 100%; }
          }
          @keyframes progressPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
          .progress-pulse {
            animation: progressPulse 400ms ease-out forwards;
          }
          .step-active {
            background-color: rgba(234, 83, 32, 0.05); /* subtle coral fill */
            position: relative;
          }
          .step-active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 3px;
            height: 0;
            background-color: #EA5320; /* 3px coral left border */
            animation: fillDown 0.8s ease-out forwards;
          }
        `}</style>

        {/* Background Skeleton representing Itinerary Page */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-12 space-y-12 opacity-40 blur-sm pointer-events-none">
          <div className="flex justify-between items-center bg-[var(--color-bg-card)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <div className="space-y-2 w-1/3">
              <div className="skeleton skeleton-text-lg" />
              <div className="skeleton skeleton-text-sm w-3/4" />
            </div>
            <div className="flex gap-4">
              <div className="skeleton skeleton-button" />
              <div className="skeleton skeleton-button" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-6">
              <div className="skeleton skeleton-text-lg w-48" />
              <div className="space-y-4">
                <div className="h-32 skeleton rounded-[var(--radius-lg)]" />
                <div className="h-32 skeleton rounded-[var(--radius-lg)]" />
                <div className="h-32 skeleton rounded-[var(--radius-lg)]" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="h-[400px] skeleton rounded-[var(--radius-lg)]" />
            </div>
          </div>
        </div>

        {/* Floating Center Card */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
          <div 
            className={`flex flex-col items-center justify-center py-12 px-8 text-center max-w-md w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] ${
              fadeOut ? 'generating-card-exit' : 'animate-fade-in'
            }`}
            style={!fadeOut ? { animationDelay: '0.3s' } : {}}
          >
            {/* Animated Core Icon Container */}
            <div className="relative mb-8 w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[var(--radius-xl)] bg-[var(--color-primary-light)] animate-ping" />
              <div className="absolute inset-1.5 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-primary)]/30 animate-spin-slow" />
              
              <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white shadow-md">
                <Plane className="-rotate-45 w-6 h-6 animate-bounce" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
              Designing Your Custom Trip
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed max-w-[280px]">
              Our autonomous travel subagents are compiling flights, lodging matching, and schedules.
            </p>

            {/* Progress Steps List */}
            <div className="w-full space-y-4 text-left px-2 mb-8">
              {steps.map((stepText, idx) => {
                const isCompleted = completedSteps.includes(idx);
                const isActive = activeStep === idx;
                const isPending = idx > activeStep;

                return (
                  <div 
                    key={idx} 
                    className={`flex items-start gap-4 p-2.5 rounded-lg relative ${
                      isActive ? 'step-active' : ''
                    }`}
                    style={{ 
                      opacity: isPending ? 0.4 : 1,
                      animation: !isPending ? 'stepIn 200ms ease-out forwards' : 'none',
                      animationDelay: !isPending ? `${idx * 300}ms` : '0ms'
                    }}
                  >
                    <div className="shrink-0 mt-0.5 relative z-10">
                      {isCompleted ? (
                        <DrawnCheckmark />
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--color-border-strong)] shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex-1 relative z-10">
                      <span className={`text-xs font-semibold leading-normal transition-colors ${
                        isActive 
                          ? 'text-[var(--color-primary)]' 
                          : isCompleted 
                          ? 'text-[var(--color-text-primary)] font-normal' 
                          : 'text-[var(--color-text-secondary)]'
                      }`}>
                        {stepText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Waiting Status / Progress Bar */}
            {isFinalWaiting ? (
              <div className="text-[11px] text-[var(--color-text-secondary)] animate-pulse flex items-center gap-2 justify-center font-bold">
                <span>AI is polishing itinerary details...</span>
              </div>
            ) : (
              <div 
                className={`w-full bg-[var(--color-bg-hover)] h-2 rounded-full overflow-hidden transition-all duration-500 ${
                  isComplete ? 'progress-pulse shadow-sm' : ''
                }`}
              >
                <div 
                  className="h-full transition-all ease-out"
                  style={{ 
                    width: `${Math.max(progress, 5)}%`,
                    backgroundColor: isComplete ? '#059669' : '#1A56DB',
                    transitionDuration: '400ms',
                    transitionProperty: 'width, background-color'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
