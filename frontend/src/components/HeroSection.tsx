import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Calendar, Wallet, Compass, Sparkles, MapPin, Search, Globe, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative overflow-hidden py-20 lg:py-20 bg-grid-pattern">
      {/* Mesh gradients absolute backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/15 rounded-lg blur-[100px] -z-10 animate-pulse-subtle"></div>
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-coral/5 dark:bg-coral/8 rounded-lg blur-[90px] -z-10" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-12 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-coral/10 dark:from-primary/20 dark:to-coral/20 text-primary px-4 py-2 rounded-lg text-xs font-semibold tracking-wide border border-primary/20 shadow-sm">
              <Sparkles className="w-4 h-4 text-coral animate-pulse" />
              <span>Unveiling Voira AI Copilot v4</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-textPrimary dark:text-dark-text leading-[1.08] font-sans">
              Travel planning, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-coral to-coral">
                reimagined by AI.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-textSecondary dark:text-dark-text-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Voira is your autonomous travel concierge. Instantly generate optimized daily schedules, real-time flight searches, budget allocations, and weather-adaptive revisions in one workspace.
            </p>

            {/* Simulated Search bar inside Hero (Compelling CTA) */}
            <div className="bg-warmWhite dark:bg-dark-card/90 border border-stoneMuted/80 dark:border-dark-border p-2 rounded-md shadow-xl flex flex-col md:flex-row gap-2 max-w-xl mx-auto lg:mx-0 backdrop-blur-md">
              <div className="flex items-center gap-2 px-4 flex-1">
                <Search className="w-4.5 h-4.5 text-textSecondary" />
                <input 
                  type="text" 
                  disabled 
                  placeholder="Where is your dream destination?" 
                  className="bg-transparent text-xs text-textPrimary dark:text-dark-text placeholder:text-textSecondary focus:outline-none w-full cursor-not-allowed"
                />
              </div>
              <Link
                to="/planner"
                className="px-6 py-4 bg-primary hover:bg-primary text-warmWhite text-xs font-semibold rounded-sm transition-all shadow-md shadow-primary/15 hover:shadow-primary/25 flex items-center justify-center gap-2"
              >
                <span>Plan Instantly</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Credibility metrics block */}
            <div className="grid grid-cols-3 gap-12 pt-12 max-w-md mx-auto lg:mx-0 border-t border-stoneMuted/50 dark:border-dark-border">
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-textPrimary dark:text-dark-text">125k+</p>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold mt-1">Trips Synced</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-textPrimary dark:text-dark-text">180+</p>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold mt-1">Cities Covered</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-semibold text-textPrimary dark:text-dark-text">4.92★</p>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold mt-1">User Score</p>
              </div>
            </div>
          </div>

          {/* Right Floating Previews Mockup (Skyscanner / Airbnb feel) */}
          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="relative mx-auto w-full max-w-[400px] aspect-[4/5] bg-gradient-to-tr from-primary/15 via-coral/10 to-coral/15 rounded-lg p-6 border border-warmWhite/10 dark:border-warmWhite/5 shadow-2xl flex flex-col justify-between overflow-hidden backdrop-blur-3xl">
              {/* Graphic background shapes */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-warmWhite/5 rounded-lg blur-2xl -mr-20 -mt-20"></div>
              <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-primary/5 rounded-lg blur-2xl"></div>

              {/* Destination Tag */}
              <div className="flex justify-between items-start z-10">
                <div className="bg-warmWhite/90 dark:bg-dark-card/90 backdrop-blur-md p-4 rounded-md border border-stoneMuted/50 dark:border-dark-border shadow-sm flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-textSecondary block font-semibold">Recommended</span>
                    <span className="text-xs font-semibold text-textPrimary dark:text-dark-text">Bali, Indonesia</span>
                  </div>
                </div>
                
                <span className="bg-successSage/15 text-successSage dark:text-successSage font-semibold text-xs px-4 py-2 rounded-lg border border-successSage/10">
                  Verified Package
                </span>
              </div>

              {/* Daily segment preview card */}
              <div className="bg-warmWhite/95 dark:bg-dark-card/95 backdrop-blur-md p-4 rounded-md shadow-xl border border-stoneMuted/50 dark:border-dark-border/80 transform rotate-1 translate-x-3 z-10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary">Day 2 • 09:30 AM</span>
                  <span className="text-xs bg-stoneMuted/30 dark:bg-dark-muted text-textSecondary px-2 py-1 rounded-sm font-semibold">28°C Sunny</span>
                </div>
                <h4 className="text-xs font-semibold text-textPrimary dark:text-dark-text">Tegalalang Rice Terraces Excursion</h4>
                <p className="text-xs text-textSecondary leading-relaxed line-clamp-2">
                  Explore scenic cascading green hillsides, enjoy the iconic jungle swing, and enjoy coconut juice.
                </p>
                <div className="mt-4 pt-2 border-t border-stoneMuted/50 dark:border-dark-border flex items-center justify-between text-xs text-textSecondary">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-textSecondary" /> Tegalalang</span>
                  <span className="font-semibold text-coral font-mono">Est: ₹800</span>
                </div>
              </div>

              {/* Mini Budget breakdown card */}
              <div className="bg-warmWhite/95 dark:bg-dark-card/95 backdrop-blur-md p-4 rounded-md shadow-xl border border-stoneMuted/50 dark:border-dark-border/80 transform -rotate-2 -translate-x-3 z-10 self-start w-5/6 space-y-2">
                <span className="text-xs font-semibold text-successSage dark:text-successSage block">Cost Matrix Summary</span>
                <div className="flex justify-between items-end">
                  <span className="text-xl font-semibold text-coral font-mono">₹59,000</span>
                  <span className="text-xs text-textSecondary">7 Days • 2 Guests</span>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="w-full bg-stoneMuted/30 dark:bg-dark-muted h-1.5 rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-coral h-full rounded-lg" style={{ width: '68%' }} />
                  </div>
                  <div className="flex justify-between text-xs text-textSecondary">
                    <span>Flights &amp; Hotel</span>
                    <span>Activities &amp; Meals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="features"></div>
    </div>
  );
};
