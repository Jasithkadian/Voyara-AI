export type TransportMode = 
  | 'bus' 
  | 'train-sleeper' 
  | 'train-ac' 
  | 'flight' 
  | 'ferry';

export type AccommodationType = 
  | 'hostel-dorm' 
  | 'guesthouse' 
  | 'budget-hotel' 
  | 'mid-hotel' 
  | 'luxury-hotel';

export type DiningType = 
  | 'street-food' 
  | 'dhaba' 
  | 'local-restaurant' 
  | 'mid-range' 
  | 'fine-dining';

export interface BudgetTier {
  tierNumber: 1 | 2 | 3 | 4;
  tierName: string;
  transportModes: TransportMode[];
  accommodationTypes: AccommodationType[];
  diningTypes: DiningType[];
  color: string; // e.g., 'green' | 'blue' | 'amber' | 'coral'
  dailyBudgetPerPerson: number;
  isTatkalApplicable: boolean;
  isSeasonallyAdjusted: boolean;
  seasonalMultiplier: number;
}

export interface MixedTransportPlan {
  legs: TransportLeg[];
}

export interface TransportLeg {
  from: string;
  to: string;
  mode: TransportMode;
  estimatedCost: number;
  duration: string;
  operator?: string;
  classType?: string;
  isTatkal?: boolean;
  isFerry?: boolean;
}

export interface DestinationMeta {
  name: string;
  isIslandDestination: boolean;
  hasTrainAccess: boolean;
  hasWaterRoute: boolean;
  peakSeasonMonths: number[];
  baseCostMultiplier: number;
  coastalRoutes?: string[];
}

export interface BudgetBreakdownEstimate {
  stay: number;
  transport: number;
  food: number;
  activities: number;
  miscellaneous: number;
  totalPerDay: number;
  tier: BudgetTier;
}
