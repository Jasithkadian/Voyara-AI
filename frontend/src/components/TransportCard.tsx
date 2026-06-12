import React, { useState } from 'react';
import { Bus, Train, Plane, Ship, ArrowRight, HelpCircle, AlertCircle, Check } from 'lucide-react';
import { TransportMode, BudgetTier } from '../types';

interface TransportCardProps {
  mode: TransportMode;
  operator: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  classType?: string;
  isTatkal?: boolean;
  isRecommended?: boolean;
  tier: BudgetTier;
  isBooked?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onBook?: () => void;
  isFerry?: boolean;
}

export const TransportCard: React.FC<TransportCardProps> = ({
  mode,
  operator,
  from,
  to,
  departureTime,
  arrivalTime,
  duration,
  price,
  classType = '',
  isTatkal = false,
  isRecommended = false,
  tier,
  isBooked = false,
  isSelected = false,
  onSelect,
  onBook,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Tier color mapping
  const tierColors: Record<number, string> = {
    1: '#10b981', // emerald-500
    2: '#3b82f6', // blue-500
    3: '#f59e0b', // amber-500
    4: '#f43f5e', // coral/rose-500
  };

  const activeColor = tierColors[tier.tierNumber] || '#10b981';

  // Train Class badge color mapping
  const getTrainClassStyle = (cType: string) => {
    const norm = cType.toUpperCase();
    if (norm.includes('SLEEPER') || norm.includes('SL')) {
      return 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
    }
    if (norm.includes('3AC') || norm.includes('3A')) {
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
    }
    if (norm.includes('2AC') || norm.includes('2A')) {
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
    }
    if (norm.includes('1AC') || norm.includes('1A')) {
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
    }
    return 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400';
  };

  // Base card wrapper styles
  const cardBorderColor = isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-[var(--color-border)]';

  return (
    <div
      className={`card-base card-interactive border rounded-2xl overflow-visible p-5 bg-[var(--color-bg-card)] transition-all ${cardBorderColor}`}
      onClick={!isBooked && !isSelected ? onSelect : undefined}
      style={{ cursor: !isBooked && !isSelected ? 'pointer' : 'default' }}
    >
      {/* Top Header Row */}
      <div className="flex justify-between items-start mb-4">
        {/* Recommended Tag */}
        {isRecommended && (
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase"
            style={{
              backgroundColor: `${activeColor}1a`,
              color: activeColor,
              border: `1px solid ${activeColor}33`,
            }}
          >
            Best for your budget
          </span>
        )}
        {!isRecommended && <div />}

        {/* Tier Tag */}
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded tracking-wider uppercase font-sans ml-auto"
          style={{
            backgroundColor: `${activeColor}1a`,
            color: activeColor,
          }}
        >
          {tier.tierName} Pick
        </span>
      </div>

      {/* Mode Specific Layout */}
      {mode === 'bus' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="p-3 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${activeColor}15` }}
            >
              <Bus size={22} style={{ color: activeColor }} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{operator}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  {classType || 'AC Sleeper'}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {from} → {to}
                </span>
              </div>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="flex items-center gap-4">
            <div className="text-left md:text-right">
              <div className="text-xs font-bold text-[var(--color-text-primary)] font-mono">
                {departureTime} - {arrivalTime}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Duration: {duration}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'train-sleeper' || mode === 'train-ac' ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="p-3 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${activeColor}15` }}
            >
              <Train size={22} style={{ color: activeColor }} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{operator}</h4>
              <div className="text-[10px] font-mono font-bold text-[var(--color-text-muted)] mt-0.5">
                Train #{classType.split('-')[1] || '12051'}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getTrainClassStyle(classType)}`}>
                  {classType.split('-')[0] || (mode === 'train-sleeper' ? 'Sleeper' : '3AC')}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {from} → {to}
                </span>
                {isTatkal && (
                  <div className="relative inline-block">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-pointer flex items-center gap-1"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      Tatkal <HelpCircle size={10} />
                    </span>
                    {showTooltip && (
                      <div className="absolute z-20 bottom-6 left-0 bg-slate-950/90 border border-white/10 px-2 py-1 rounded text-[9px] text-stone-300 w-44 shadow-lg backdrop-blur-xs font-sans">
                        Tatkal surcharge applied — booking within 7 days of travel.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="flex items-center gap-4">
            <div className="text-left md:text-right">
              <div className="text-xs font-bold text-[var(--color-text-primary)] font-mono">
                {departureTime} - {arrivalTime}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Duration: {duration}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'flight' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="p-3 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${activeColor}15` }}
            >
              <Plane size={22} style={{ color: activeColor }} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{operator}</h4>
              <div className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5">
                Flight {classType || '6E-501'}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {from} → {to}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-purple-500/20 bg-purple-500/10 text-purple-400">
                  Direct
                </span>
              </div>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="flex items-center gap-4">
            <div className="text-left md:text-right">
              <div className="text-xs font-bold text-[var(--color-text-primary)] font-mono">
                {departureTime} - {arrivalTime}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Duration: {duration}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'ferry' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className="p-3 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${activeColor}15` }}
            >
              <Ship size={22} style={{ color: activeColor }} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[var(--color-text-primary)]">{operator}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-teal-500/20 bg-teal-500/10 text-teal-400">
                  Scenic Route
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                  {from} → {to}
                </span>
              </div>
            </div>
          </div>

          {/* Time & Duration */}
          <div className="flex items-center gap-4">
            <div className="text-left md:text-right">
              <div className="text-xs font-bold text-[var(--color-text-primary)] font-mono">
                {departureTime} - {arrivalTime}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                Journey: {duration}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info / Price & Selection Actions */}
      <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--color-text-muted)] block">
            Estimated Cost
          </span>
          <span className="text-base font-bold text-[#f43f5e] font-mono leading-none">
            {formatCurrency(price)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isBooked ? (
            <span className="flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              ✓ Booked
            </span>
          ) : isSelected ? (
            <div className="flex items-center gap-2">
              {onBook && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBook();
                  }}
                  className="btn-primary text-[10px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg leading-none shrink-0"
                >
                  Add to Itinerary
                </button>
              )}
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center border border-purple-500">
                <Check size={16} />
              </div>
            </div>
          ) : (
            onSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="btn-secondary text-[11px] py-1.5 px-3.5 rounded-lg border font-bold"
              >
                Select Option
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

TransportCard.displayName = 'TransportCard';
