import React, { useState, useEffect } from 'react';
import { Plane, CheckCircle2, Circle } from 'lucide-react';

interface LoadingStateProps {
  source?: string;
  destination?: string;
  budget?: number;
  days?: number;
  onFinished?: () => void;
  isApiReady?: boolean;
}

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
    // Run each step for 3.5 seconds
    const stepInterval = 3500;

    const timer = setInterval(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        
        // Mark previous step as completed
        setCompletedSteps(comp => [...comp, prev]);

        if (next >= steps.length) {
          clearInterval(timer);
          // If we reached the end, notify parent or wait for API
          return steps.length - 1;
        }
        return next;
      });
    }, stepInterval);

    return () => clearInterval(timer);
  }, [steps.length]);

  // Check if we can proceed to trigger completion
  useEffect(() => {
    const allStepsAnimated = completedSteps.length >= steps.length - 1;
    if (allStepsAnimated && isApiReady && onFinished) {
      // Small buffer for final checkmark satisfaction
      const timeout = setTimeout(() => {
        onFinished();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [completedSteps, isApiReady, onFinished, steps.length]);

  const isFinalWaiting = completedSteps.length >= steps.length - 1 && !isApiReady;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-bg-page)] overflow-hidden flex flex-col">
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
        <div className="flex flex-col items-center justify-center py-12 px-8 text-center max-w-md w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)]">
          {/* Animated Core Icon Container */}
          <div className="relative mb-8 w-20 h-20 flex items-center justify-center">
            {/* Pulsing Ring */}
            <div className="absolute inset-0 rounded-[var(--radius-xl)] bg-[var(--color-primary-light)] animate-ping" />
            {/* Rotating dash ring */}
            <div className="absolute inset-1.5 rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--color-primary)]/30 animate-spin-slow" />
            
            {/* Plane Core */}
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
                  className={`flex items-start gap-3 transition-opacity duration-300 ${
                    isPending ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-success)] shrink-0 animate-scale-in" />
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--color-border-strong)] shrink-0 mt-0.5" />
                  )}
                  
                  <span className={`text-xs font-semibold leading-normal ${
                    isActive 
                      ? 'text-[var(--color-primary)]' 
                      : isCompleted 
                      ? 'text-[var(--color-text-primary)] font-normal' 
                      : 'text-[var(--color-text-secondary)]'
                  }`}>
                    {stepText}
                  </span>
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
            <div className="w-full bg-[var(--color-bg-hover)] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
