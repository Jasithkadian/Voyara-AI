import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { Compass, Wallet, Hotel, MessageSquare, RefreshCw, Star, ShieldCheck, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Compass,
      color: 'bg-primary/10 text-primary',
      title: 'Autonomous Travel Agent',
      desc: 'Orchestrates specialized subagents (flights, lodging, weather, budget) to build a unified custom package automatically.',
    },
    {
      icon: Wallet,
      color: 'bg-successSage/10 text-successSage dark:text-successSage',
      title: 'Real-Time Budget Control',
      desc: 'Automatic allocations, cost matrices, and overspending warnings tied directly to your localized travel expenses.',
    },
    {
      icon: Hotel,
      color: 'bg-coral/10 text-coral',
      title: 'Aggregator Search Engine',
      desc: 'Live flight searches and smart lodging matches with simulated secure checkout and confirmation reference tools.',
    },
    {
      icon: MessageSquare,
      color: 'bg-coral/10 text-coral dark:text-coral',
      title: 'Smart AI Concierge',
      desc: 'Grounds packing questions, travel alerts, and itinerary recommendations in curated custom search citations.',
    },
    {
      icon: RefreshCw,
      color: 'bg-warningAmber/10 text-warningAmber dark:text-warningAmber',
      title: 'Real-Time Monitoring',
      desc: 'Autonomous trip monitoring tracks weather forecasts, immediately updating outdoor schedules with indoor plans.',
    },
    {
      icon: Zap,
      color: 'bg-primary/10 text-primary dark:text-primary',
      title: 'Instant Sandbox Deployment',
      desc: 'One-click guest portal provisions active sandboxes immediately for evaluation without requiring signups.',
    }
  ];

  return (
    <div className="bg-gradient-mesh min-h-screen">
      <HeroSection />

      {/* Skyscanner-like Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-semibold text-coral block">Capabilities</span>
          <h2 className="text-4xl font-semibold text-textPrimary dark:text-dark-text tracking-tight">
            Streamlining every phase of your journey
          </h2>
          <p className="text-sm text-textSecondary dark:text-dark-text-muted max-w-xl mx-auto leading-relaxed">
            Eliminate tabs, messy spreadsheets, and hours of research. Voira unites discovery, planning, checkout, and monitoring in one workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="bg-warmWhite/60 dark:bg-dark-card/60 backdrop-blur-md border border-stoneMuted/50 dark:border-dark-border/40 rounded-lg p-6.5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] group relative overflow-hidden"
              >
                {/* Subtle glowing accent */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className={`w-12 h-12 rounded-md ${feat.color} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-semibold text-base text-textPrimary dark:text-dark-text mb-2 tracking-tight">
                  {feat.title}
                </h3>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Airbnb-style Trust Badges / Social Proof */}
      <section className="py-20 bg-stoneMuted/30 dark:bg-dark-card/20 border-y border-stoneMuted/40 dark:border-dark-border/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-4 bg-primary/10 text-primary rounded-md shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-textPrimary dark:text-dark-text">Secure Checkout Simulations</h4>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed">Simulate Stripe and Razorpay checkouts with automatic webhook processing and booking references.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-4 bg-warningAmber/10 text-warningAmber dark:text-warningAmber rounded-md shrink-0">
                <Star className="w-6 h-6 fill-amber-500/10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-textPrimary dark:text-dark-text">Curated AI Recommendations</h4>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed">Hybrid recommendation intelligence aggregates historical travel preferences to match lodging choices.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-4 bg-coral/10 text-coral rounded-md shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-textPrimary dark:text-dark-text">Weather-Adaptive Itineraries</h4>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed">Instantly checks local weather warnings and dynamically rewrites outdoor plans to premium indoor guides.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual CTA Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        <div className="bg-gradient-to-r from-primary via-coral to-coral rounded-lg p-12 sm:p-20 text-warmWhite shadow-2xl relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute top-0 left-0 w-80 h-80 bg-warmWhite/5 rounded-lg blur-3xl -ml-20 -mt-20" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-textPrimary/10 rounded-lg blur-3xl -mr-20 -mb-20" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-xs font-semibold text-warmWhite/80 bg-warmWhite/10 px-4 py-1 rounded-lg inline-block">Sandbox Ready</span>
            <h2 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-none">
              Explore Voira today.
            </h2>
            <p className="text-sm sm:text-base text-warmWhite/80 max-w-lg mx-auto leading-relaxed">
              Experience the full product in 30 seconds. Generate plans, simulate bookings, and track weather timelines immediately.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/planner"
                className="w-full sm:w-auto px-12 py-4 bg-primary text-warmWhite font-semibold rounded-sm shadow-lg shadow-primary/15 hover:bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2"
              >
                <span>Start Planner</span>
                <ArrowRight className="w-4 h-4 text-warmWhite" />
              </Link>
              
              <Link
                to="/demo"
                className="w-full sm:w-auto px-12 py-4 bg-warmWhite/10 text-warmWhite font-semibold rounded-sm hover:bg-warmWhite/20 border border-warmWhite/20 hover:border-warmWhite/35 transition-all text-xs flex items-center justify-center gap-2"
              >
                Explore a sample trip
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
