import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { Compass, Wallet, Hotel, MessageSquare, RefreshCw, Star, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Compass,
      color: 'bg-blue-500/10 text-brand',
      title: 'AI Trip Planner',
      desc: 'Get highly personalized day-wise itineraries matching your exact dates, travel interests, and style.',
    },
    {
      icon: Wallet,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      title: 'Smart Budget Estimator',
      desc: 'Automatic breakdown of hotel, food, transit, and activity costs to help you stay within your limits.',
    },
    {
      icon: Hotel,
      color: 'bg-rose-500/10 text-rose-500',
      title: 'Hotel Recommendations',
      desc: 'Find curated stays tailored to your budget class, style preferences, and proximity to major sights.',
    },
    {
      icon: MessageSquare,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      title: 'AI Travel Assistant',
      desc: 'Chat with our copilot anytime to ask about packing lists, local customs, dining spots, or safety tips.',
    },
    {
      icon: RefreshCw,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      title: 'Dynamic Replanning',
      desc: 'Change of plans? Weather forecast shift? Ask the AI to regenerate your plan with updated parameters.',
    },
    {
      icon: Zap,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      title: 'Instant Generation',
      desc: 'Skip hours of manual research. Generate a comprehensive travel schedule in under 15 seconds.',
    }
  ];

  return (
    <div className="bg-gradient-mesh min-h-screen">
      <HeroSection />

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white">
            Everything you need for a stress-free journey
          </h2>
          <p className="text-slate-500 dark:text-neutral-400 mt-3 text-base">
            No more messy spreadsheets or endless browser tabs. AI Travel Copilot does the heavy lifting so you can enjoy the ride.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`w-12 h-12 rounded-2xl ${feat.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trust Badges / Social Proof */}
      <section className="py-16 bg-slate-100/50 dark:bg-neutral-900/50 border-y border-slate-200/40 dark:border-neutral-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-10 h-10 text-brand mb-3" />
              <h4 className="font-bold text-slate-850 dark:text-neutral-100">Secure & Confidential</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-[240px]">Your user details and saved travel plans are stored securely.</p>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-10 h-10 text-amber-500 mb-3 fill-amber-500/10" />
              <h4 className="font-bold text-slate-850 dark:text-neutral-100">High Precision Ratings</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-[240px]">Cross-checked hotel and attraction ratings represent real feedback.</p>
            </div>
            <div className="flex flex-col items-center">
              <Compass className="w-10 h-10 text-accent mb-3" />
              <h4 className="font-bold text-slate-850 dark:text-neutral-100">Personalized Insights</h4>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 max-w-[240px]">Itineraries tailored exactly to your chosen interests, dates, and budget.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-brand to-cyan-500 dark:from-brand-600 dark:to-cyan-600 rounded-3xl p-10 sm:p-16 text-white shadow-2xl relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -ml-20 -mt-20"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to explore the world?
            </h2>
            <p className="text-lg text-sky-100 max-w-xl mx-auto">
              Create your account now to save itineraries, unlock the AI chat assistant, and replan your trips dynamically.
            </p>
            <div>
              <Link
                to={isAuthenticated ? "/planner" : "/planner"}
                className="inline-block px-8 py-4 bg-white text-brand font-bold rounded-2xl shadow-lg hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Plan My First Trip
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
