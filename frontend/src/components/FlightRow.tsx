import React, { useState } from 'react';
import { Badge } from './Badge';
import { Check, ExternalLink, Bell } from 'lucide-react';

export interface FlightData {
  airline: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  price: number;
  stops: number;
  durationMinutes?: number;
  baggage?: string;
  cancellation?: string;
  trend?: 'cheaper' | 'pricier' | 'neutral';
  trendText?: string;
  isBestValue?: boolean;
  isRecommended?: boolean;
}

interface FlightRowProps {
  flight: FlightData;
  isBooked: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  onBook: () => void;
}

export const FlightRow: React.FC<FlightRowProps> = React.memo(({ 
  flight, 
  isBooked, 
  isSelected, 
  isDimmed, 
  onSelect, 
  onBook 
}) => {
  const [alertSet, setAlertSet] = useState(false);
  const [alertPrice, setAlertPrice] = useState<number>(flight.price - 400);
  
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSet(true);
    // Persist to local storage mock
    const alerts = JSON.parse(localStorage.getItem('voira_price_alerts') || '[]');
    alerts.push({ flight: flight.flightNumber, price: alertPrice });
    localStorage.setItem('voira_price_alerts', JSON.stringify(alerts));
  };

  return (
    <div className={`transition-all duration-300 ${isSelected ? 'selected shadow-[var(--shadow-md)] z-10 relative' : ''} ${isDimmed ? 'dimmed' : ''}`}>
      <div 
        className="flight-row cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6" 
        onClick={!isBooked && !isSelected ? onSelect : undefined}
      >
        {/* Mobile View: Stacked layout (times left, price right, airline below) */}
        <div className="flex md:hidden items-center justify-between w-full relative pt-2">
          {flight.isBestValue && (
            <span className="absolute -top-1 left-0 bg-[var(--color-success-bg)] text-[var(--color-success)] text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-xs)] tracking-wider">
              BEST VALUE
            </span>
          )}
          {flight.isRecommended && (
            <span className="absolute -top-1 left-0 bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-xs)] tracking-wider">
              RECOMMENDED
            </span>
          )}
          {/* Times / Stops on left */}
          <div className="text-left mt-2.5">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
              <span>{flight.departure}</span>
              <span className="text-[var(--color-text-muted)] font-normal">→</span>
              <span>{flight.arrival}</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`} • {flight.durationMinutes ? formatDuration(flight.durationMinutes) : '2h 30m'}
            </div>
          </div>
          
          {/* Price on right */}
          <div className="text-right">
            <div className="text-sm font-bold text-[var(--color-accent)] font-mono">{formatCurrency(flight.price)}</div>
            <div className="text-[9px] text-[var(--color-text-muted)]">one-way</div>
          </div>
        </div>

        {/* Mobile Airline Details (Below route/price) */}
        <div className="flex md:hidden items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <div className="w-6 h-6 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold text-[9px]">
            {flight.airline.slice(0, 3).toUpperCase()}
          </div>
          <span>{flight.airline} • {flight.flightNumber}</span>
        </div>

        {/* Desktop elements - Hidden on Mobile */}
        <div className="hidden md:flex items-center justify-between w-full relative">
          {/* Airline Info */}
          <div className="flight-row__airline w-full sm:w-auto relative">
            {flight.isBestValue && (
              <span className="absolute -top-3 left-0 bg-[var(--color-success-bg)] text-[var(--color-success)] text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-xs)] tracking-wider">
                BEST VALUE
              </span>
            )}
            {flight.isRecommended && (
              <span className="absolute -top-3 left-0 bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[9px] font-bold px-1.5 py-0.5 rounded-[var(--radius-xs)] tracking-wider">
                RECOMMENDED
              </span>
            )}
            <div className="flight-row__airline-badge mt-2 sm:mt-0">
              {flight.airline.slice(0, 3).toUpperCase()}
            </div>
            <div className="mt-2 sm:mt-0">
              <div className="flight-row__airline-name">{flight.airline}</div>
              <div className="flight-row__flight-code">Flight {flight.flightNumber}</div>
            </div>
          </div>

          {/* Route & Time */}
          <div className="flight-row__route w-full sm:w-auto order-3 sm:order-none">
            <div className="flight-row__time">{flight.departure}</div>
            <div className="flight-row__connector" />
            <div className="flight-row__time">{flight.arrival}</div>
          </div>

          {/* Stops & Duration */}
          <div className="w-full sm:w-auto order-4 sm:order-none text-center">
            <div className="text-[11px] font-mono text-[var(--color-text-muted)] mb-1">
              ⏱ {flight.durationMinutes ? formatDuration(flight.durationMinutes) : '2h 30m'}
            </div>
            <div className={`flight-row__stops ${flight.stops === 0 ? 'direct' : ''}`}>
              {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Price & Action */}
          <div className="flight-row__price-col w-full sm:w-auto order-2 sm:order-none">
            <div className="flex items-center gap-4 w-full justify-between sm:justify-end">
              <div className="text-right">
                <div className="flight-row__price">{formatCurrency(flight.price)}</div>
                <div className={`flight-row__price-trend ${flight.trend || 'neutral'}`}>
                  {flight.trendText || '→ Same price for 3 days'}
                </div>
              </div>
              <div>
                {isBooked ? (
                  <Badge type="verified" label="Booked" />
                ) : isSelected ? (
                  <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className="btn-secondary h-8 px-3 text-[11px]"
                  >
                    Select Flight
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile select button: full width below details (only if NOT selected/booked) */}
        {!isBooked && !isSelected && (
          <div className="w-full md:hidden pt-2 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="w-full btn-secondary h-11 flex items-center justify-center text-xs"
            >
              Select Flight
            </button>
          </div>
        )}

        {isBooked && (
          <div className="w-full md:hidden flex justify-end">
            <Badge type="verified" label="Booked" />
          </div>
        )}
      </div>

      {/* Expandable Booking Panel */}
      {isSelected && (
        <div className="bg-[var(--color-bg-page)] border-t border-[var(--color-border-subtle)] p-6 animate-fade-in space-y-4 rounded-b-[var(--radius-lg)]">
          <div className="bg-[var(--color-success-bg)] border border-[var(--color-success-border)] text-[var(--color-success)] p-3 rounded-[var(--radius-md)] flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">{flight.airline} {flight.flightNumber} selected</p>
              <p className="text-xs mt-0.5">Delhi → Goa · {flight.departure}–{flight.arrival} · {flight.stops === 0 ? 'Direct' : `${flight.stops} Stops`} · {formatCurrency(flight.price)}</p>
              {(flight.baggage || flight.cancellation) && (
                <div className="flex gap-2 mt-2 text-[10px] uppercase tracking-wider font-bold">
                  {flight.baggage && <span className="bg-white/50 px-2 py-0.5 rounded">{flight.baggage}</span>}
                  {flight.cancellation && <span className="bg-white/50 px-2 py-0.5 rounded">{flight.cancellation}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">What would you like to do next?</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onBook}
                className="btn-primary"
              >
                Add to itinerary
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/search?q=book+${flight.airline}+flight+${flight.flightNumber}`, '_blank')}
                className="btn-secondary flex items-center gap-2"
              >
                <span>Book on Airline Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">
              Voira will save your selection to your trip plan. You can book directly on the airline's website.
            </p>
          </div>

          {/* Price Alert */}
          <div className="pt-4 border-t border-[var(--color-border-subtle)]">
            {alertSet ? (
              <p className="text-xs font-semibold text-[var(--color-success)] flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" /> Alert set! We'll email you if {flight.airline} {flight.flightNumber} drops below {formatCurrency(alertPrice)}.
              </p>
            ) : (
              <form onSubmit={handleAlertSubmit} className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs">
                <span className="text-[var(--color-text-secondary)]">Notify me if this price drops below</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={alertPrice}
                    onChange={(e) => setAlertPrice(Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-[var(--color-border-strong)] rounded-[var(--radius-sm)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] font-mono text-[var(--color-text-primary)] font-bold"
                  />
                  <button type="submit" className="font-bold text-[var(--color-primary)] hover:underline whitespace-nowrap">
                    Set Alert →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

FlightRow.displayName = 'FlightRow';
