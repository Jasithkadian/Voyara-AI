import React, { useState } from 'react';
import { AttractionRecommendation } from '../services/api';
import { Star, Compass, MapPin, Sparkles } from 'lucide-react';

interface AttractionCardProps {
  attractions: AttractionRecommendation[];
}

const CATEGORIES = ['All', 'Adventure', 'Nature', 'Food', 'Culture', 'Nightlife'] as const;

export const AttractionCard: React.FC<AttractionCardProps> = ({ attractions }) => {
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All');

  const filteredAttractions = selectedCategory === 'All'
    ? attractions
    : attractions.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase());

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'adventure': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'nature': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'food': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      case 'culture': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'nightlife': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Must-Visit Attractions</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">Top sights and local gems by category</p>
          </div>
        </div>

        {/* Category Toggles */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-brand text-white shadow-md shadow-brand/20'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredAttractions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-neutral-850 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
          <Sparkles className="w-8 h-8 text-slate-350 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">No recommendations found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAttractions.map((attraction, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl bg-slate-50/50 dark:bg-neutral-850/40 border border-slate-150 dark:border-neutral-800/60 hover:bg-slate-50 dark:hover:bg-neutral-850/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getCategoryColor(attraction.category)}`}>
                    {attraction.category}
                  </span>
                  {attraction.rating && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                      <span>{attraction.rating}</span>
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                  {attraction.name}
                </h4>

                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed mb-4">
                  {attraction.description}
                </p>
              </div>

              {attraction.location && (
                <div className="pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex items-center gap-1 text-[11px] text-slate-450 dark:text-neutral-500">
                  <MapPin className="w-3.5 h-3.5 text-brand" />
                  <span>{attraction.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
