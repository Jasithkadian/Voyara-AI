import React from 'react';
import { Badge } from './Badge';

interface FlightRowProps {
  flight: any;
  isBooked: boolean;
  onBook: () => void;
}

export const FlightRow: React.FC<FlightRowProps> = React.memo(({ flight, isBooked, onBook }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const isCheaper = flight.price < 6000;

  return (
    <div className="flight-row">
      {/* Airline Info */}
      <div className="flight-row__airline w-full sm:w-auto">
        <div className="flight-row__airline-badge">
          {flight.airline.slice(0, 3).toUpperCase()}
        </div>
        <div>
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
        <div className="text-[11px] font-mono text-[var(--color-text-muted)] mb-1">⏱ 2h 30m</div>
        <div className={`flight-row__stops ${flight.stops === 0 ? 'direct' : ''}`}>
          {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Price & Action */}
      <div className="flight-row__price-col w-full sm:w-auto order-2 sm:order-none">
        <div className="flex items-center gap-4 w-full justify-between sm:justify-end">
          <div className="text-right">
            <div className="flight-row__price">{formatCurrency(flight.price)}</div>
            <div className={`flight-row__price-trend ${isCheaper ? 'cheaper' : 'pricier'}`}>
              {isCheaper ? '↓ ₹200 vs yesterday' : '↑ Prices rising'}
            </div>
          </div>
          <div>
            {isBooked ? (
              <Badge type="verified" label="Booked" />
            ) : (
              <button
                onClick={onBook}
                className="btn-primary h-8 px-3 text-[11px]"
              >
                Select Flight
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

FlightRow.displayName = 'FlightRow';
