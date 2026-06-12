import React, { useState } from 'react';
import { HeroSection } from '../components/HeroSection';
import { Plane, Hotel, Wallet, Utensils, Compass, CloudSun, Shield, Star, ShieldCheck, RefreshCw, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTripStore } from '../store/useTripStore';
import { parseNaturalLanguage } from '../utils/parser';

type CategoryKey = 'popular' | 'trending' | 'weekend' | 'luxury' | 'budget';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const setTripPrompt = useTripStore(state => state.setTripPrompt);
  const setTripData = useTripStore(state => state.setTripData);

  const [activeTab, setActiveTab] = useState<CategoryKey>('popular');

  const destinationCategories = {
    popular: [
      {
        name: 'Goa, India',
        image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
        description: 'Golden beaches, vibrant nightlife, and historic churches.',
        prompt: '5 day trip to Goa under 20000 for 2 people interested in beaches and nightlife'
      },
      {
        name: 'Manali, India',
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80',
        description: 'Snowy peaks, adventure paragliding, and clean river valleys.',
        prompt: '4 days in Manali under 15000 for a group of 3 friends interested in adventure'
      },
      {
        name: 'Ooty, India',
        image: 'https://images.unsplash.com/photo-1590050752117-238cb0612b1b?auto=format&fit=crop&w=600&q=80',
        description: 'Lush tea gardens, cool mountain breeze, and scenic toy trains.',
        prompt: '3 days weekend trip to Ooty under 10000 for relaxation'
      },
      {
        name: 'Munnar, India',
        image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
        description: 'Misty hills, tea estates, and peaceful wildlife sanctuaries.',
        prompt: '4 days Munnar family retreat under 25k'
      }
    ],
    trending: [
      {
        name: 'Bali, Indonesia',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
        description: 'Lush rice terraces, temples, and tranquil beaches.',
        prompt: '7 day couple retreat in Bali under 60k'
      },
      {
        name: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=600&q=80',
        description: 'Neon skylines, ancient shrines, and incredible food.',
        prompt: '8 days solo in Tokyo for food and culture, budget 1.5L'
      },
      {
        name: 'Singapore',
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=600&q=80',
        description: 'Futuristic gardens, premium shopping, and vibrant skyline.',
        prompt: '5 days in Singapore under 80000 for 2 people'
      },
      {
        name: 'Dubai, UAE',
        image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=600&q=80',
        description: 'Ultramodern architecture, luxury shopping, and desert safaris.',
        prompt: '5 days in Dubai under 75000'
      }
    ],
    weekend: [
      {
        name: 'Jaipur, India',
        image: 'https://images.unsplash.com/photo-1477584305590-3877d547565c?auto=format&fit=crop&w=600&q=80',
        description: 'Pink palaces, royal forts, and rich heritage sites.',
        prompt: '3 days weekend in Jaipur under 12k for culture'
      },
      {
        name: 'Rishikesh, India',
        image: 'https://images.unsplash.com/photo-1598977123418-45f04b61b49e?auto=format&fit=crop&w=600&q=80',
        description: 'Yoga retreats, river rafting, and evening Ganga Aarti.',
        prompt: '3 days Rishikesh trip under 8000 for adventure'
      },
      {
        name: 'Agra, India',
        image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
        description: 'Home of Taj Mahal and Mughalai culinary walks.',
        prompt: '2 days Agra tour under 5k'
      },
      {
        name: 'Pondicherry, India',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
        description: 'French quarters, serene ashrams, and quiet beaches.',
        prompt: '3 days Pondicherry couple getaway under 15000'
      }
    ],
    luxury: [
      {
        name: 'Maldives',
        image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80',
        description: 'Overwater bungalows, turquoise waters, and private villa stays.',
        prompt: '5 days luxury Maldives honeymoon under 2.5 lakhs'
      },
      {
        name: 'Swiss Alps',
        image: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=600&q=80',
        description: 'Breathtaking peaks, ski slopes, and luxury chalets.',
        prompt: '10 days Swiss Alps hiking, budget 2.5 lakhs'
      },
      {
        name: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80',
        description: 'Romantic bistros, iconic museums, and designer shopping.',
        prompt: '6 days Paris luxury trip under 3 lakhs'
      },
      {
        name: 'London, UK',
        image: 'https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?auto=format&fit=crop&w=600&q=80',
        description: 'Royal palaces, world-class theatre, and historic pubs.',
        prompt: '7 days London explorer under 2 lakh'
      }
    ],
    budget: [
      {
        name: 'Kasol, India',
        image: 'https://images.unsplash.com/photo-1617653243176-3532cf2bdfb6?auto=format&fit=crop&w=600&q=80',
        description: 'Hippie cafes, pine forests, and riverside camping spots.',
        prompt: '4 days Kasol trek under 7000'
      },
      {
        name: 'Gokarna, India',
        image: 'https://images.unsplash.com/photo-1588598126707-160fa8674dcf?auto=format&fit=crop&w=600&q=80',
        description: 'Half-moon beaches, trekking, and beach shacks.',
        prompt: '3 days Gokarna solo beach trip under 6000'
      },
      {
        name: 'Pushkar, India',
        image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80',
        description: 'Holy lake, camel desert walks, and extremely cheap food.',
        prompt: '3 days Pushkar under 5000'
      },
      {
        name: 'Hampi, India',
        image: 'https://images.unsplash.com/photo-1600100397608-f010b423b971?auto=format&fit=crop&w=600&q=80',
        description: 'Ruins of Vijayanagara, boulder climbing, and coracle rides.',
        prompt: '3 days Hampi backpacking under 6000'
      }
    ]
  };

  const aiAgents = [
    {
      icon: Plane,
      title: 'Flight Agent',
      desc: 'Orchestrates real-time airline matrices, flight durations, layovers, and custom seat selections.',
      color: 'text-blue-400 bg-blue-500/10'
    },
    {
      icon: Hotel,
      title: 'Stay Agent',
      desc: 'Matches handpicked hotels matching your daily budget, location scores, and guest reviews.',
      color: 'text-purple-400 bg-purple-500/10'
    },
    {
      icon: Wallet,
      title: 'Budget Agent',
      desc: 'Performs expense breakdowns, audits activity costs, and allocates a 10% safety emergency buffer.',
      color: 'text-emerald-400 bg-emerald-500/10'
    },
    {
      icon: Utensils,
      title: 'Food Agent',
      desc: 'Scrapes local food joints, cuisines, and top-rated restaurants matching your dietary profile.',
      color: 'text-orange-400 bg-orange-500/10'
    },
    {
      icon: Compass,
      title: 'Local Guide Agent',
      desc: 'Assembles customized day itineraries with optimal sightseeing order and travel directions.',
      color: 'text-pink-400 bg-pink-500/10'
    },
    {
      icon: CloudSun,
      title: 'Weather Agent',
      desc: 'Monitors regional rainfall warnings to automatically swap outdoor excursions with indoor museum tours.',
      color: 'text-cyan-400 bg-cyan-500/10'
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

  const tabs: Array<{ id: CategoryKey; label: string }> = [
    { id: 'popular', label: 'Popular This Week' },
    { id: 'trending', label: 'Trending International' },
    { id: 'weekend', label: 'Weekend Escapes' },
    { id: 'luxury', label: 'Luxury Destinations' },
    { id: 'budget', label: 'Budget Friendly' }
  ];

  return (
    <div className="bg-[#0b0c16] text-white min-h-screen">
      <HeroSection />

      {/* Destination Discovery Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block">Destination Discovery</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Plan Your Next Escape
          </h2>
          <p className="text-stone-400 text-sm max-w-xl mx-auto leading-relaxed">
            Select one of our handpicked locations to pre-populate parameters into the AI Travel Copilot.
          </p>
        </div>

        {/* Tab switch bar */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-1 bg-white/5 border border-white/10 p-1 rounded-xl overflow-x-auto scrollbar-hide max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Destinations grid content */}
        <div className="min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {destinationCategories[activeTab].map((dest, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -8, scale: 1.02 }}
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
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* AI Agents Capabilities Section */}
      <section className="py-24 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest block font-sans">Autonomous Network</span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Meet Your Autonomous Agent Team
            </h2>
            <p className="text-stone-400 text-sm max-w-xl mx-auto leading-relaxed">
              Instead of searching dozens of platforms, Voyara orchestration agents run parallel searches, cross-checks, and optimize itineraries instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiAgents.map((agent, idx) => {
              const Icon = agent.icon;
              return (
                <motion.div 
                  key={idx} 
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-purple-500/5 transition-all text-left flex flex-col items-start space-y-4 hover:border-purple-500/25 backdrop-blur-md"
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
        </div>
      </section>

      {/* Airbnb-style Trust Badges */}
      <section className="py-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
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
