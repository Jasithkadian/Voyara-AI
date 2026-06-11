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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-xl shadow-xl">
      
      {/* Animated Core Icon Container */}
      <div className="relative mb-10 w-20 h-20 flex items-center justify-center">
        {/* Pulsing Ring */}
        <div className="absolute inset-0 rounded-xl bg-primary/10 dark:bg-primary/20 animate-ping"></div>
        {/* Rotating dash ring */}
        <div className="absolute inset-1.5 rounded-xl border-2 border-dashed border-primary/30 animate-spin-slow"></div>
        
        {/* Plane Core */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-coral flex items-center justify-center text-warmWhite shadow-md">
          <Plane className="-rotate-45 w-6 h-6 animate-bounce" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-textPrimary dark:text-warmWhite tracking-tight mb-2">
        Designing Your Custom Trip
      </h3>
      <p className="text-xs text-textSecondary dark:text-dark-text-muted mb-8 leading-relaxed max-w-[280px]">
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
                <CheckCircle2 className="w-5 h-5 text-successSage shrink-0 animate-scale-in" />
              ) : isActive ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-stoneMuted dark:text-dark-border shrink-0 mt-0.5" />
              )}
              
              <span className={`text-xs font-semibold leading-normal ${
                isActive 
                  ? 'text-primary' 
                  : isCompleted 
                  ? 'text-textPrimary dark:text-dark-text font-normal' 
                  : 'text-textSecondary'
              }`}>
                {stepText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Final Waiting Status */}
      {isFinalWaiting ? (
        <div className="text-[11px] text-textSecondary animate-pulse flex items-center gap-2 justify-center font-semibold">
          <span>AI is polishing itinerary details...</span>
        </div>
      ) : (
        <div className="w-36 bg-stoneMuted dark:bg-dark-muted h-1 rounded-full overflow-hidden mx-auto">
          <div 
            className="bg-gradient-to-r from-primary to-coral h-full rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
