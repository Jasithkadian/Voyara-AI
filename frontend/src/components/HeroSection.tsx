import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Calendar, Wallet, Compass, MessageSquare, RefreshCw, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HeroSection: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative overflow-hidden py-20 lg:py-32">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-brand/10 rounded-full blur-3xl -z-10 animate-pulse-subtle"></div>
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" style={{ animationDelay: '1.5s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-brand/10 dark:bg-brand/20 text-brand px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase border border-brand/20">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>Next-Gen Travel AI Assistant</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Plan your next trip with <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-accent-600">
                AI Travel Copilot
              </span>
            </h1>
            
            <p className="text-lg text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto lg:mx-0">
              Generate personalized day-wise itineraries, instant budget breakdowns, customized hotel recommendations, and hidden attraction lists in seconds using artificial intelligence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                to={isAuthenticated ? "/planner" : "/planner"}
                className="w-full sm:w-auto px-8 py-4 bg-brand text-white font-semibold rounded-2xl shadow-lg shadow-brand/25 hover:bg-brand-600 hover:shadow-brand/35 hover:-translate-y-0.5 transition-all text-center"
              >
                Plan a New Trip
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-neutral-850 hover:-translate-y-0.5 transition-all text-center"
              >
                Explore Features
              </a>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 max-w-md mx-auto lg:mx-0 border-t border-slate-200/60 dark:border-neutral-800/60">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">100k+</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Trips Planned</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">150+</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">Destinations</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">4.9★</p>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">User Rating</p>
              </div>
            </div>
          </div>

          {/* Floating Previews Grid */}
          <div className="lg:col-span-5 relative hidden md:block">
            <div className="relative mx-auto w-full max-w-[420px] aspect-[4/5] bg-gradient-to-tr from-brand/20 to-accent/20 rounded-3xl p-6 border border-white/20 shadow-2xl flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-10 -mt-10"></div>
              
              {/* Header inside mockup */}
              <div className="flex justify-between items-start z-10">
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-sm">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-slate-800 dark:text-neutral-100">Paris, France</span>
                  </div>
                  <span className="text-[10px] text-slate-500">5 Days • 2 Travelers</span>
                </div>
                
                <div className="bg-brand text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-md">
                  Active Plan
                </div>
              </div>

              {/* Floating Itinerary Card */}
              <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 transform rotate-1 translate-x-2 z-10">
                <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Day 2: Culture & Romance</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-neutral-100 mt-0.5">Louvre Museum & Seine River Cruise</h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 line-clamp-2">
                  Beat the crowds in the morning at the Louvre to see the Mona Lisa, followed by a romantic lunch at a bistro.
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800 pt-2 text-[10px] font-medium text-slate-500">
                  <span>Est: €50 / person</span>
                  <span className="bg-slate-150 dark:bg-neutral-800 px-2 py-0.5 rounded-full">3 hours</span>
                </div>
              </div>

              {/* Floating Budget Card */}
              <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/10 transform -rotate-2 -translate-x-4 z-10 self-start w-5/6">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Budget Allocation</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-lg font-bold text-slate-800 dark:text-white">$1,500</span>
                  <span className="text-[10px] text-slate-500">92% of budget limit</span>
                </div>
                
                {/* Visual mini bar chart */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center text-[10px]">
                    <span className="w-12 text-slate-400">Hotels</span>
                    <div className="flex-1 bg-slate-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden ml-2">
                      <div className="bg-brand h-full rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div className="flex items-center text-[10px]">
                    <span className="w-12 text-slate-400">Food</span>
                    <div className="flex-1 bg-slate-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden ml-2">
                      <div className="bg-accent h-full rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature grid placeholder anchor */}
      <div id="features"></div>
    </div>
  );
};
