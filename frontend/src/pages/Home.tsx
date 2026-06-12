import React from 'react';
import { HeroSection } from '../components/HeroSection';
import { Plane, Hotel, Wallet, Utensils, Compass, CloudSun, ShieldCheck, Star, Shield, RefreshCw, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTripStore } from '../store/useTripStore';
import { parseNaturalLanguage } from '../utils/parser';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const setTripPrompt = useTripStore(state => state.setTripPrompt);
  const setTripData = useTripStore(state => state.setTripData);

  const popularDestinations = [
    {
      name: 'Goa, India',
      image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
      description: 'Golden beaches, vibrant nightlife, and historic churches.',
      prompt: '5 day trip to Goa under 20000 for 2 people'
    },
    {
      name: 'Bali, Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
      description: 'Lush rice terraces, temples, and tranquil beaches.',
      prompt: '7 day couple retreat in Bali under 60k'
    },
    {
      name: 'Swiss Alps',
      image: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=600&q=80',
      description: 'Breathtaking peaks, ski slopes, and luxury chalets.',
      prompt: '10 days Swiss Alps hiking, budget 2.5 lakhs'
    },
    {
      name: 'Tokyo, Japan',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80',
      description: 'Neon skylines, ancient shrines, and incredible food.',
      prompt: '8 days solo in Tokyo for food and culture, budget 1.5L'
    }
  ];

  const trendingTrips = [
    {
      title: 'Goa Weekend Getaway',
      duration: '3 Days',
      budget: '₹12,000',
      travelers: '2 Guests',
      moods: ['Beaches', 'Nightlife'],
      prompt: '3 day weekend trip to Goa under 12k with my partner'
    },
    {
      title: 'Bali Explorer Tour',
      duration: '8 Days',
      budget: '₹50,000',
      travelers: '1 Guest',
      moods: ['Culture', 'Adventure'],
      prompt: '8 days solo Bali adventure under 50000'
    },
    {
      title: 'Switzerland Alpine Luxury',
      duration: '6 Days',
      budget: '₹1,80,000',
      travelers: '4 Guests',
      moods: ['Nature', 'Relaxation'],
      prompt: '6 days family trip to Switzerland under 2 lakhs for relaxation'
    }
  ];

  const aiAgents = [
    {
      icon: Plane,
      title: 'Flight Agent',
      desc: 'Orchestrates real-time airline matrices, seats, and custom departures.',
      color: 'text-blue-400 bg-blue-500/10'
    },
    {
      icon: Hotel,
      title: 'Stay Agent',
      desc: 'Matches handpicked hotels matching your daily budget and location scores.',
      color: 'text-purple-400 bg-purple-500/10'
    },
    {
      icon: Wallet,
      title: 'Budget Agent',
      desc: 'Performs cost estimation matrices and sets safety emergency buffers.',
      color: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      icon: Utensils,
      title: 'Food Agent',
      desc: 'Aggregates local menus, cuisines, and top-rated restaurant tables.',
      color: 'text-orange-400 bg-orange-500/10'
    },
    {
      icon: Compass,
      title: 'Local Guide Agent',
      desc: 'Crates customized itineraries with optimal timings and transit details.',
      color: 'text-pink-400 bg-pink-500/10'
    },
    {
      icon: CloudSun,
      title: 'Weather Agent',
      desc: 'Re-writes plans in real time to avoid rainfall or monsoon disruptions.',
      color: 'text-cyan-400 bg-cyan-500/10'
    },
    {
      icon: Shield,
      title: 'Visa Agent',
      desc: 'Audits entry requirements, checklists, and document sets automatically.',
      color: 'text-indigo-400 bg-indigo-500/10'
    }
  ];

  const handlePromptClick = (promptText: string) => {
    const parsed = parseNaturalLanguage(promptText);
    setTripPrompt(promptText);
    setTripData({
      destination: parsed.destination,
      budget: parsed.budget,
      duration: parsed.days,
      travelers: parsed.travelers,
      moods: parsed.interests,
      dates: parsed.dates,
      generatedItinerary: null
    });
    navigate('/planner');
  };

  return (
    <div className="bg-[#0b0c16] text-white min-h-screen">
      <HeroSection />

      {/* Popular Destinations Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">Discovery</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Popular Destinations
          </h2>
          <p className="text-stone-400 text-sm max-w-xl mx-auto leading-relaxed">
            Select one of these global favorites to instantly pre-populate the AI generator tool.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {popularDestinations.map((dest, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -8, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={() => handlePromptClick(dest.prompt)}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:shadow-purple-500/10 transition-all cursor-pointer group relative aspect-[3/4]"
            >
              <img 
                src={dest.image} 
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0 -z-10" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 flex flex-col justify-end p-6 z-10" />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20 space-y-2">
                <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors flex items-center justify-between">
                  <span>{dest.name}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1" />
                </h3>
                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                  {dest.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending Trips Section */}
      <section className="py-24 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block font-sans">Trending Now</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Trending Copilot Packages
            </h2>
            <p className="text-stone-400 text-sm max-w-xl mx-auto leading-relaxed">
              Curated packages engineered recently by travelers using our autonomous search matrices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trendingTrips.map((trip, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => handlePromptClick(trip.prompt)}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-purple-500/20 hover:shadow-purple-500/5 transition-all cursor-pointer text-left"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{trip.duration}</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">{trip.budget}</span>
                  </div>
                  <h3 className="font-bold text-lg text-white leading-snug">{trip.title}</h3>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {trip.moods.map((mood, mIdx) => (
                      <span key={mIdx} className="text-[10px] bg-white/5 text-stone-300 px-2.5 py-1 rounded-full border border-white/5 font-semibold">
                        {mood}
                      </span>
                    ))}
                    <span className="text-[10px] bg-white/5 text-stone-300 px-2.5 py-1 rounded-full border border-white/5 font-semibold">
                      {trip.travelers}
                    </span>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-white/5 text-xs text-stone-400 flex items-center justify-between font-bold hover:text-white transition-colors">
                  <span>Generate instantly</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Subagents Capabilities Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block font-sans">Autonomous Network</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Meet Your Autonomous Agent Team
          </h2>
          <p className="text-stone-400 text-sm max-w-xl mx-auto leading-relaxed">
            Instead of searching dozens of platforms, Voyara orchestration agents run parallel searches, cross-checks, and optimize itineraries instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {aiAgents.map((agent, idx) => {
            const Icon = agent.icon;
            return (
              <motion.div 
                key={idx} 
                whileHover={{ scale: 1.03, y: -4 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/5 transition-all text-left flex flex-col items-start space-y-4 hover:border-purple-500/25"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${agent.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white tracking-tight">
                  {agent.title}
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed font-medium">
                  {agent.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Airbnb-style Trust Badges */}
      <section className="py-20 bg-white/[0.01] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-white">Interactive Sandbox Engine</h4>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed font-medium">Pre-provisioned guest keys in 30 seconds for test evaluations without credentials.</p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-white">Dynamic Budget Matrix</h4>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed font-medium">Track your stays, meals, and flight bookings against dynamic targets with emergency offsets.</p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-white">Autonomous Weather Shifts</h4>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed font-medium">Auto-tracks regional rainfall and monsoon warnings to swap outdoor events with indoor experiences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual CTA Banner */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 rounded-3xl p-12 sm:p-20 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <span className="text-[10px] font-bold text-white/90 bg-white/10 px-4 py-1.5 rounded-full inline-block uppercase tracking-wider">Demo Ready</span>
            <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight leading-none">
              Explore Voyara Today.
            </h2>
            <p className="text-sm sm:text-base text-stone-200 max-w-lg mx-auto leading-relaxed">
              Experience the full autonomous travel planner. Plan stays, simulate bookings, and track local weather forecasts immediately.
            </p>
            <div className="pt-4 flex flex-col md:flex-row justify-center items-center gap-4">
              <Link
                to="/planner"
                className="bg-white text-indigo-950 font-bold px-8 py-3 rounded-xl hover:bg-stone-100 transition-colors shadow-lg shadow-black/10 active:scale-95 text-sm w-full md:w-auto flex items-center justify-center gap-2"
              >
                <span>Launch Planner</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/demo"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-8 py-3 rounded-xl transition-all active:scale-95 text-sm w-full md:w-auto flex items-center justify-center"
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
