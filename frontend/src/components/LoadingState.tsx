import React, { useState, useEffect } from 'react';
import { Plane, Circle, MapPin } from 'lucide-react';

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
    <div className="fixed inset-0 z-[10000] bg-[#0F172A] flex items-center justify-center animate-fade-out" style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}>
      <div className="relative w-full max-w-2xl px-8">
        <svg viewBox="65 8 15 25" className="w-full h-auto opacity-20 stroke-white fill-none">
          <path d="M 60 0 L 80 0 L 80 40 L 60 40 Z" fill="none" />
          {/* Simplified India Outline Mockup */}
          <path d="M 72 10 L 78 12 L 77 20 L 73 24 L 68 18 L 70 12 Z" strokeWidth="0.2" />
        </svg>

        {/* Delhi Pin */}
        <div className="absolute top-[32%] left-[76%] -translate-x-1/2 -translate-y-1/2 animate-pin-pulse">
          <MapPin className="w-4 h-4 text-white fill-white" />
        </div>

        {/* Goa Pin (Appears later) */}
        <div className="absolute top-[60%] left-[73%] -translate-x-1/2 -translate-y-1/2 opacity-0" style={{ animation: 'pinPulse 0.3s ease-out 1s forwards' }}>
          <div className="absolute inset-0 w-8 h-8 -left-2 -top-2 bg-white/20 rounded-full animate-ping" />
          <MapPin className="w-5 h-5 text-[var(--color-accent)] fill-[var(--color-accent)]" />
        </div>

        {/* Flight Path Arc */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <path 
            id="flight-path"
            d="M 76 32 Q 60 45 73 60" 
            fill="none" 
            stroke="white" 
            strokeWidth="0.5" 
            strokeDasharray="2,2"
            style={{ 
              strokeDasharray: 100, 
              strokeDashoffset: 100, 
              animation: 'drawPath 1s ease-out 0.2s forwards' 
            }}
          />
          {/* Plane Icon */}
          <g style={{ offsetPath: "path('M 76 32 Q 60 45 73 60')", animation: 'planeFly 1s ease-out 0.2s forwards' }}>
            <foreignObject width="20" height="20" x="-10" y="-10">
              <Plane className="w-4 h-4 text-white rotate-45" />
            </foreignObject>
          </g>
        </svg>

        <div className="mt-12 text-center text-white/60 font-mono text-sm tracking-widest uppercase animate-pulse">
          Establishing Flight Path...
        </div>
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
        setTimeout(onFinished, 400); // Wait for fade out animation
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
      
      <div className={`fixed inset-0 z-50 bg-[var(--color-bg-page)] overflow-hidden flex flex-col transition-all duration-350 ${fadeOut ? 'opacity-0 translate-y-[-20px] scale-95' : 'opacity-100'}`}>
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center max-w-md w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)]">
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
                    className={`flex items-start gap-4 transition-all duration-200 relative ${
                      isPending ? 'opacity-40' : 'opacity-100 translate-x-0'
                    } ${!isPending && !isActive && !isCompleted ? 'translate-x-[-12px] opacity-0' : ''}`}
                    style={{ animation: !isPending ? 'pageIn 0.2s ease-out forwards' : 'none' }}
                  >
                    <div className="shrink-0 mt-0.5 relative">
                      {isCompleted ? (
                        <DrawnCheckmark />
                      ) : isActive ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--color-border-strong)] shrink-0" />
                      )}
                    </div>
                    
                    <div className={`flex-1 relative ${isActive ? 'step-active' : ''}`}>
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

            {/* Final Waiting Status */}
            {isFinalWaiting ? (
              <div className="text-[11px] text-[var(--color-text-secondary)] animate-pulse flex items-center gap-2 justify-center font-bold">
                <span>AI is polishing itinerary details...</span>
              </div>
            ) : (
              <div className={`w-full bg-[var(--color-bg-hover)] h-2 rounded-full overflow-hidden transition-all duration-500 ${isComplete ? 'scale-[1.02] shadow-sm' : ''}`}>
                <div 
                  className={`h-full transition-all duration-300 ease-out ${isComplete ? 'bg-[var(--color-success)]' : 'bg-[var(--color-primary)]'}`}
                  style={{ width: `${Math.max(progress, 5)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
