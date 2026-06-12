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
      case 'adventure': return 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning-border)]';
      case 'nature': return 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)]';
      case 'food': return 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]/20';
      case 'culture': return 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/20';
      case 'nightlife': return 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]/20';
      default: return 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]';
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">Must-Visit Attractions</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Top sights and local gems by category</p>
          </div>
        </div>

        {/* Category Toggles */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-hide py-1 max-w-full">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                  : 'bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-active)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredAttractions.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-bg-hover)] rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)]">
          <Sparkles className="w-6 h-6 text-[var(--color-text-muted)] mx-auto mb-2" />
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No recommendations found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {filteredAttractions.map((attraction, idx) => (
            <ActivityCard
              key={idx}
              name={attraction.name}
              description={attraction.description}
              time=""
              location={attraction.location}
              isAttraction={true}
              category={attraction.category}
              rating={attraction.rating}
              cost={attraction.estimatedCost}
              duration={attraction.recommendedDuration}
            />
          ))}
        </div>
      )}
    </div>
  );
};

