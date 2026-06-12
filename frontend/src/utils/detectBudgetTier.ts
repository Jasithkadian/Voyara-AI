import { BudgetTier, DestinationMeta, BudgetBreakdownEstimate, TransportMode, AccommodationType, DiningType } from '../types';
import destinationsData from '../data/destinations.json';

const destinations = destinationsData as DestinationMeta[];

export interface DetectBudgetTierParams {
  totalBudget: number;
  tripDays: number;
  travelerCount: number;
  destination: string;
  travelMonth: number; // 1-12
  bookingLeadDays: number;
}

export function getDestinationMeta(destinationName: string): DestinationMeta | null {
  if (!destinationName) return null;
  const match = destinations.find(
    (d) => d.name.toLowerCase() === destinationName.trim().toLowerCase()
  );
  return match || null;
}

export function detectBudgetTier(params: DetectBudgetTierParams): BudgetTier {
  const {
    totalBudget,
    tripDays,
    travelerCount,
    destination,
    travelMonth,
    bookingLeadDays,
  } = params;

  const days = tripDays <= 0 ? 1 : tripDays;
  const travelers = travelerCount <= 0 ? 1 : travelerCount;

  // Step 1: raw daily per person
  const rawDailyPerPerson = totalBudget / days / travelers;

  // Step 2: get destination meta and seasonal multiplier
  const meta = getDestinationMeta(destination);
  let baseMultiplier = 1.0;
  let isSeasonallyAdjusted = false;
  let peakMonths: number[] = [];

  if (meta) {
    baseMultiplier = meta.baseCostMultiplier;
    peakMonths = meta.peakSeasonMonths;
    if (peakMonths.includes(travelMonth)) {
      isSeasonallyAdjusted = true;
    }
  }

  const seasonalMultiplier = isSeasonallyAdjusted ? baseMultiplier * 1.4 : baseMultiplier;
  let effectiveDailyBudget = rawDailyPerPerson / (seasonalMultiplier || 1.0);

  // Step 3: Tatkal adjustment
  let isTatkalApplicable = false;
  if (bookingLeadDays < 7) {
    isTatkalApplicable = true;
    effectiveDailyBudget = effectiveDailyBudget * 0.85; // 15% reduction in purchasing power
  }

  // Step 4: classify into tier
  let tierNumber: 1 | 2 | 3 | 4 = 1;
  let tierName = 'Backpacker';
  let color = 'green';
  let baseTransport: TransportMode[] = ['bus'];
  let accommodationTypes: AccommodationType[] = ['hostel-dorm'];
  let diningTypes: DiningType[] = ['street-food', 'dhaba'];

  if (effectiveDailyBudget < 2000) {
    tierNumber = 1;
    tierName = 'Backpacker';
    color = 'green';
    baseTransport = ['bus'];
    accommodationTypes = ['hostel-dorm'];
    diningTypes = ['street-food', 'dhaba'];
  } else if (effectiveDailyBudget < 5000) {
    tierNumber = 2;
    tierName = 'Budget Traveler';
    color = 'blue';
    baseTransport = ['train-sleeper', 'bus'];
    accommodationTypes = ['guesthouse', 'budget-hotel'];
    diningTypes = ['local-restaurant'];
  } else if (effectiveDailyBudget <= 12000) {
    tierNumber = 3;
    tierName = 'Mid Range';
    color = 'amber';
    baseTransport = ['train-ac', 'flight'];
    accommodationTypes = ['mid-hotel'];
    diningTypes = ['mid-range'];
  } else {
    tierNumber = 4;
    tierName = 'Premium';
    color = 'coral';
    baseTransport = ['flight'];
    accommodationTypes = ['luxury-hotel'];
    diningTypes = ['fine-dining'];
  }

  // Step 5: overrides
  let transportModes = [...baseTransport];
  if (meta) {
    if (meta.isIslandDestination) {
      transportModes = ['flight'];
    } else {
      // Water routes (ferries) for Tier 1 & 2
      if (meta.hasWaterRoute && (tierNumber === 1 || tierNumber === 2)) {
        transportModes.push('ferry');
      }
      // Train access override
      if (!meta.hasTrainAccess) {
        transportModes = transportModes.filter(
          (m) => m !== 'train-sleeper' && m !== 'train-ac'
        );
        if (transportModes.length === 0) {
          transportModes = ['bus'];
        }
      }
    }
  }

  return {
    tierNumber,
    tierName,
    transportModes,
    accommodationTypes,
    diningTypes,
    color,
    dailyBudgetPerPerson: Math.round(rawDailyPerPerson),
    isTatkalApplicable,
    isSeasonallyAdjusted,
    seasonalMultiplier,
  };
}

export function getUpgradeNudge(params: DetectBudgetTierParams): string | null {
  const currentTier = detectBudgetTier(params);
  if (currentTier.tierNumber === 4) return null;

  const days = params.tripDays <= 0 ? 1 : params.tripDays;
  const travelers = params.travelerCount <= 0 ? 1 : params.travelerCount;

  // Find target effective daily budget
  let targetEffectiveDaily = 2000;
  let targetFeature = 'train recommendations';

  if (currentTier.tierNumber === 2) {
    targetEffectiveDaily = 5000;
    targetFeature = 'AC train recommendations';
  } else if (currentTier.tierNumber === 3) {
    targetEffectiveDaily = 12001;
    targetFeature = 'flights and luxury hotels';
  }

  // Current effective daily budget calculation parts
  const meta = getDestinationMeta(params.destination);
  const baseMultiplier = meta ? meta.baseCostMultiplier : 1.0;
  const isPeak = meta ? meta.peakSeasonMonths.includes(params.travelMonth) : false;
  const seasonalMultiplier = isPeak ? baseMultiplier * 1.4 : baseMultiplier;
  const tatkalFactor = params.bookingLeadDays < 7 ? 0.85 : 1.0;

  // Let's find current effectiveDailyBudget
  const rawDaily = params.totalBudget / days / travelers;
  const currentEffective = rawDaily / seasonalMultiplier * tatkalFactor;

  // Check if within 20% of boundary
  const thresholdRange = targetEffectiveDaily * 0.20;
  const distance = targetEffectiveDaily - currentEffective;

  if (distance > 0 && distance <= thresholdRange) {
    // Calculate required raw daily per person
    const targetRawDaily = (targetEffectiveDaily / tatkalFactor) * seasonalMultiplier;
    const targetTotalBudget = targetRawDaily * days * travelers;
    const neededTotal = targetTotalBudget - params.totalBudget;
    const neededDailyPerPerson = neededTotal / days / travelers;

    return `Add ₹${Math.ceil(neededTotal).toLocaleString('en-IN')} more (₹${Math.ceil(
      neededDailyPerPerson
    ).toLocaleString('en-IN')} per day per person) to unlock ${targetFeature}.`;
  }

  return null;
}

export function getBudgetBreakdownEstimate(
  tier: BudgetTier,
  tripDays: number,
  travelerCount: number
): BudgetBreakdownEstimate {
  const days = tripDays <= 0 ? 1 : tripDays;
  const travelers = travelerCount <= 0 ? 1 : travelerCount;

  const dailyPerPerson = tier.dailyBudgetPerPerson;
  const totalDaily = dailyPerPerson * travelers;

  let stayPct = 0.30;
  let transportPct = 0.15;
  let foodPct = 0.35;
  let activitiesPct = 0.10;
  let miscPct = 0.10;

  if (tier.tierNumber === 2) {
    stayPct = 0.35;
    transportPct = 0.20;
    foodPct = 0.30;
    activitiesPct = 0.10;
    miscPct = 0.05;
  } else if (tier.tierNumber === 3) {
    stayPct = 0.40;
    transportPct = 0.25;
    foodPct = 0.20;
    activitiesPct = 0.10;
    miscPct = 0.05;
  } else if (tier.tierNumber === 4) {
    stayPct = 0.45;
    transportPct = 0.30;
    foodPct = 0.15;
    activitiesPct = 0.08;
    miscPct = 0.02;
  }

  return {
    stay: Math.round(totalDaily * stayPct),
    transport: Math.round(totalDaily * transportPct),
    food: Math.round(totalDaily * foodPct),
    activities: Math.round(totalDaily * activitiesPct),
    miscellaneous: Math.round(totalDaily * miscPct),
    totalPerDay: totalDaily,
    tier,
  };
}
