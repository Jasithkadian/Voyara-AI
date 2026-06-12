import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TripPlan, DailyPlan } from '../services/api';

export interface TripState {
  tripPrompt: string;
  destination: string;
  budget: number;
  duration: number;
  travelers: number;
  moods: string[];
  dates: string;
  generatedItinerary: TripPlan | null;
  selectedHotels: any[];
  selectedFlights: any[];
  activeTripId: number;
  loadingStep: number;

  setTripPrompt: (prompt: string) => void;
  setDestination: (dest: string) => void;
  setBudget: (budget: number) => void;
  setDuration: (duration: number) => void;
  setTravelers: (travelers: number) => void;
  setMoods: (moods: string[]) => void;
  setDates: (dates: string) => void;
  setGeneratedItinerary: (itinerary: TripPlan | null) => void;
  setSelectedHotels: (hotels: any[]) => void;
  setSelectedFlights: (flights: any[]) => void;
  setActiveTripId: (id: number) => void;
  setLoadingStep: (step: number) => void;
  setTripData: (data: Partial<Omit<TripState, 'setTripPrompt' | 'setDestination' | 'setBudget' | 'setDuration' | 'setTravelers' | 'setMoods' | 'setDates' | 'setGeneratedItinerary' | 'setSelectedHotels' | 'setSelectedFlights' | 'setActiveTripId' | 'setLoadingStep' | 'setTripData' | 'updateDayPlan' | 'resetStore'>>) => void;
  updateDayPlan: (dayNumber: number, dayPlan: DailyPlan) => void;
  resetStore: () => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      tripPrompt: '',
      destination: '',
      budget: 30000,
      duration: 5,
      travelers: 1,
      moods: ['beaches'],
      dates: 'Upcoming dates',
      generatedItinerary: null,
      selectedHotels: [],
      selectedFlights: [],
      activeTripId: 0,
      loadingStep: 0,

      setTripPrompt: (tripPrompt) => set({ tripPrompt }),
      setDestination: (destination) => set({ destination }),
      setBudget: (budget) => set({ budget }),
      setDuration: (duration) => set({ duration }),
      setTravelers: (travelers) => set({ travelers }),
      setMoods: (moods) => set({ moods }),
      setDates: (dates) => set({ dates }),
      setGeneratedItinerary: (generatedItinerary) => set({ generatedItinerary }),
      setSelectedHotels: (selectedHotels) => set({ selectedHotels }),
      setSelectedFlights: (selectedFlights) => set({ selectedFlights }),
      setActiveTripId: (activeTripId) => set({ activeTripId }),
      setLoadingStep: (loadingStep) => set({ loadingStep }),
      setTripData: (data) => set((state) => ({ ...state, ...data })),
      updateDayPlan: (dayNumber, dayPlan) => set((state) => {
        if (!state.generatedItinerary) return state;
        const itinerary = { ...state.generatedItinerary };
        const updatedDaily = itinerary.dailyItinerary.map((d) => 
          d.day === dayNumber ? dayPlan : d
        );
        return {
          ...state,
          generatedItinerary: {
            ...itinerary,
            dailyItinerary: updatedDaily
          }
        };
      }),
      resetStore: () => set({
        tripPrompt: '',
        destination: '',
        budget: 30000,
        duration: 5,
        travelers: 1,
        moods: ['beaches'],
        dates: 'Upcoming dates',
        generatedItinerary: null,
        selectedHotels: [],
        selectedFlights: [],
        activeTripId: 0,
        loadingStep: 0,
      }),
    }),
    {
      name: 'voyara-trip-storage',
    }
  )
);
