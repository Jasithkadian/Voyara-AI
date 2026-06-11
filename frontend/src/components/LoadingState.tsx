import React, { useState, useEffect } from 'react';
import { Plane, Compass, Sparkles } from 'lucide-react';

const LOADING_STEPS = [
  "Calling AI Travel Agents...",
  "Analyzing destination highlights...",
  "Assembling day-by-day activities...",
  "Finding best hotel recommendations...",
  "Calculating food and transport budgets...",
  "Customizing hidden gems matching your interests...",
  "Polishing travel tips...",
  "Finalizing your dream itinerary..."
];

export const LoadingState: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
      {/* Animated Icon Container */}
      <div className="relative mb-12 w-24 h-24 flex items-center justify-center">
        {/* Pulsing Outer Ring */}
        <div className="absolute inset-0 rounded-lg bg-primary/10 dark:bg-primary/20 animate-ping"></div>
        {/* Rotating Intermediate Ring */}
        <div className="absolute inset-2 rounded-lg border-2 border-dashed border-primary/40 animate-spin-slow"></div>
        
        {/* Core Icon */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-tr from-primary to-coral flex items-center justify-center text-warmWhite shadow-xl shadow-primary/35">
          <Plane className="-rotate-45 w-8 h-8 animate-bounce" />
        </div>
        
        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-warningAmber animate-pulse" />
      </div>

      {/* Progress Messaging */}
      <h3 className="text-xl font-semibold text-textSecondary dark:text-warmWhite mb-2">
        Designing Your Perfect Trip
      </h3>
      
      <div className="h-6 overflow-hidden relative w-full mb-4">
        <p className="text-sm font-semibold text-primary animate-pulse-subtle transition-all duration-500">
          {LOADING_STEPS[currentStep]}
        </p>
      </div>

      <div className="w-48 bg-stoneMuted dark:bg-dark-card h-1 rounded-lg overflow-hidden mx-auto">
        <div className="bg-gradient-to-r from-primary to-coral h-full w-2/3 rounded-lg animate-pulse"></div>
      </div>
      
      <p className="text-xs text-textSecondary mt-4 leading-relaxed max-w-[280px]">
        This may take up to 15 seconds as our AI tailors details specifically for you.
      </p>
    </div>
  );
};
