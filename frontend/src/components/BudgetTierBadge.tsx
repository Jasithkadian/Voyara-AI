import React from 'react';
import { Bus, Train, Plane } from 'lucide-react';
import { detectBudgetTier } from '../utils/detectBudgetTier';
import { BudgetTier } from '../types';

interface BudgetTierBadgeProps {
  totalBudget?: number;
  tripDays?: number;
  travelerCount?: number;
  destination?: string;
  travelMonth?: number;
  bookingLeadDays?: number;
  tier?: BudgetTier | null;
}

export const BudgetTierBadge: React.FC<BudgetTierBadgeProps> = ({
  totalBudget,
  tripDays,
  travelerCount,
  destination,
  travelMonth,
  bookingLeadDays,
  tier,
}) => {
  const resolvedTier = tier || detectBudgetTier({
    totalBudget: totalBudget || 0,
    tripDays: tripDays || 1,
    travelerCount: travelerCount || 1,
    destination: destination || '',
    travelMonth: travelMonth || (new Date().getMonth() + 1),
    bookingLeadDays: bookingLeadDays || 30,
  });

  // Map tier details
  let colorHex = '#10b981'; // Backpacker green
  let borderHex = '#10b98133';
  let bgHex = '#10b9811a';
  let tierLabel = 'Backpacker';
  let announceText = 'Budget updated. Now showing Backpacker tier. Bus recommended as primary transport.';

  if (resolvedTier.tierNumber === 1) {
    colorHex = '#10b981';
    borderHex = '#10b98133';
    bgHex = '#10b9811a';
    tierLabel = 'Backpacker';
    announceText = 'Budget updated. Now showing Backpacker tier. Bus recommended as primary transport.';
  } else if (resolvedTier.tierNumber === 2) {
    colorHex = '#3b82f6'; // Budget traveler blue
    borderHex = '#3b82f633';
    bgHex = '#3b82f61a';
    tierLabel = 'Budget Traveler';
    announceText = 'Budget updated. Now showing Budget Traveler tier. Train recommended as primary transport.';
  } else if (resolvedTier.tierNumber === 3) {
    colorHex = '#f59e0b'; // Mid range amber
    borderHex = '#f59e0b33';
    bgHex = '#f59e0b1a';
    tierLabel = 'Mid Range';
    announceText = 'Budget updated. Now showing Mid Range tier. Mix of train and flights recommended.';
  } else if (resolvedTier.tierNumber === 4) {
    colorHex = '#f43f5e'; // Premium coral
    borderHex = '#f43f5e33';
    bgHex = '#f43f5e1a';
    tierLabel = 'Premium';
    announceText = 'Budget updated. Now showing Premium tier. Flights recommended for primary transport.';
  }

  // Handle island override announcement
  const isIsland = resolvedTier.transportModes.length === 1 && resolvedTier.transportModes[0] === 'flight' && (resolvedTier.tierNumber === 1 || resolvedTier.tierNumber === 2);
  if (isIsland) {
    announceText = `Budget updated. Now showing ${tierLabel} tier. Flights are required for this island destination.`;
  }

  return (
    <div aria-live="polite" className="inline-block">
      {/* Visually hidden text for screen readers */}
      <span className="sr-only">{announceText}</span>
      
      <div
        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border"
        style={{
          color: colorHex,
          backgroundColor: bgHex,
          borderColor: borderHex,
        }}
      >
        {resolvedTier.tierNumber === 1 && <Bus size={14} style={{ color: colorHex }} />}
        {resolvedTier.tierNumber === 2 && <Train size={14} style={{ color: colorHex }} />}
        {resolvedTier.tierNumber === 3 && (
          <div className="flex items-center">
            <Train size={14} style={{ color: colorHex }} />
            <span className="text-[10px] mx-0.5" style={{ color: colorHex }}>/</span>
            <Plane size={14} style={{ color: colorHex }} />
          </div>
        )}
        {resolvedTier.tierNumber === 4 && <Plane size={14} style={{ color: colorHex }} />}
        <span className="font-sans leading-none">{tierLabel}</span>
      </div>
    </div>
  );
};
