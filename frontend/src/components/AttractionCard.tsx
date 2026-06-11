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
      case 'adventure': return 'bg-warningAmber/10 text-warningAmber dark:text-warningAmber';
      case 'nature': return 'bg-successSage/10 text-successSage dark:text-successSage';
      case 'food': return 'bg-coral/10 text-coral dark:text-coral';
      case 'culture': return 'bg-primary/10 text-primary dark:text-primary';
      case 'nightlife': return 'bg-coral/10 text-coral dark:text-coral';
      default: return 'bg-stoneMuted/30 text-textPrimary dark:text-dark-text-muted';
    }
  };

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-lg p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-textPrimary dark:text-dark-text">Must-Visit Attractions</h3>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted">Top sights and local gems by category</p>
          </div>
        </div>

        {/* Category Toggles */}
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-warmWhite shadow-sm'
                  : 'bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textSecondary hover:text-textPrimary dark:text-dark-text'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredAttractions.length === 0 ? (
        <div className="text-center py-12 bg-warmWhite dark:bg-dark-elevated rounded-md border border-dashed border-stoneMuted dark:border-dark-border">
          <Sparkles className="w-6 h-6 text-textSecondary mx-auto mb-2" />
          <p className="text-sm font-normal text-textSecondary dark:text-dark-text-muted">No recommendations found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAttractions.map((attraction, idx) => (
            <div 
              key={idx} 
              className="p-comfortable rounded-md bg-warmWhite/50 dark:bg-dark-elevated/40 border border-stoneMuted dark:border-dark-border/60 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-sm ${getCategoryColor(attraction.category)}`}>
                    {attraction.category}
                  </span>
                  {attraction.rating && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-warningAmber">
                      <Star className="w-4 h-4 fill-warningAmber stroke-warningAmber" />
                      <span>{attraction.rating}</span>
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-textPrimary dark:text-dark-text mb-1">
                  {attraction.name}
                </h4>

                <p className="text-xs text-textSecondary dark:text-dark-text-muted leading-relaxed mb-4">
                  {attraction.description}
                </p>
              </div>

              {attraction.location && (
                <div className="pt-4 border-t border-stoneMuted/50 dark:border-dark-border flex items-center gap-1 text-xs text-textSecondary dark:text-dark-text-muted">
                  <MapPin className="w-4 h-4 text-primary" />
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
