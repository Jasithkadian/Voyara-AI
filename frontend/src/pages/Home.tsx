import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { Compass, Wallet, Hotel, MessageSquare, RefreshCw, Star, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {

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
    <div className="bg-[var(--color-bg-page)] min-h-screen">
      <HeroSection />

      {/* Skyscanner-like Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-semibold text-[var(--color-accent)] block uppercase tracking-wider">Capabilities</span>
          <h2 className="section-headline">
            Streamlining every phase of your journey
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
            Eliminate tabs, messy spreadsheets, and hours of research. voira unites discovery, planning, checkout, and monitoring in one workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            // Map legacy colors to new system
            let featColor = "bg-[var(--color-primary-light)] text-[var(--color-primary)]";
            if (feat.title.includes("Budget")) featColor = "bg-[var(--color-success-bg)] text-[var(--color-success)]";
            if (feat.title.includes("Search") || feat.title.includes("Concierge")) featColor = "bg-[var(--color-accent-light)] text-[var(--color-accent)]";
            if (feat.title.includes("Monitoring")) featColor = "bg-[var(--color-warning-bg)] text-[var(--color-warning)]";

            return (
              <div 
                key={idx} 
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1 active:scale-[0.99] group relative overflow-hidden"
              >
                <div className={`w-12 h-12 rounded-[var(--radius-md)] ${featColor} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-semibold text-base text-[var(--color-text-primary)] mb-2 tracking-tight">
                  {feat.title}
                </h3>
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Airbnb-style Trust Badges / Social Proof */}
      <section className="py-20 bg-[var(--color-bg-hover)] border-y border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-4 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-[var(--radius-md)] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)]">Secure Checkout Simulations</h4>
                <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] leading-relaxed">Simulate Stripe and Razorpay checkouts with automatic webhook processing and booking references.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-4 bg-[var(--color-warning-bg)] text-[var(--color-warning)] rounded-[var(--radius-md)] shrink-0">
                <Star className="w-6 h-6 fill-[var(--color-warning)]/10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)]">Curated AI Recommendations</h4>
                <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] leading-relaxed">Hybrid recommendation intelligence aggregates historical travel preferences to match lodging choices.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="p-4 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-[var(--radius-md)] shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-[var(--text-sm)] text-[var(--color-text-primary)]">Weather-Adaptive Itineraries</h4>
                <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] leading-relaxed">Instantly checks local weather warnings and dynamically rewrites outdoor plans to premium indoor guides.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual CTA Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        <div className="bg-[var(--gradient-brand)] rounded-[var(--radius-xl)] p-12 sm:p-20 text-[var(--color-text-on-dark)] shadow-[var(--shadow-lg)] relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <span className="text-[var(--text-xs)] font-semibold text-white/80 bg-white/10 px-4 py-1 rounded-[var(--radius-full)] inline-block uppercase tracking-wider">Sandbox Ready</span>
            <h2 className="text-4xl sm:text-6xl font-display font-semibold tracking-tight leading-none">
              Explore voira today.
            </h2>
            <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto leading-relaxed">
              Experience the full product in 30 seconds. Generate plans, simulate bookings, and track weather timelines immediately.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                to="/planner"
                className="btn-cta w-full sm:w-auto"
              >
                <span>Start Planner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                to="/demo"
                className="btn-secondary w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
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
