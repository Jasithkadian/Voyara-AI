import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WeatherDay {
  day: number;
  condition: string;
  temp: number;
}

export interface Activity {
  time: string; // Morning, Afternoon, Evening
  title: string;
  description: string;
  estimatedCost: number;
  duration: string;
  location: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  recommendedMeal: string;
  estimatedCost: number;
  description: string;
}

export interface DailyPlan {
  day: number;
  weather: string;
  activities: Activity[];
  restaurants: Restaurant[];
}

export interface BudgetBreakdown {
  hotel_cost: number;
  food_cost: number;
  transportation_cost: number;
  activity_cost: number;
  miscellaneous_cost: number;
  total_cost: number;
}

export interface HotelRecommendation {
  name: string;
  rating: string;
  pricePerNight: string;
  distanceFromCenter: string;
  description: string;
}

export interface AttractionRecommendation {
  name: string;
  description: string;
  category: 'Nature' | 'Adventure' | 'Food' | 'Culture' | 'Nightlife';
  location: string;
  rating: string;
}

export interface TripPlan {
  tripSummary: {
    destination: string;
    days: number;
    travelers: number;
  };
  dailyItinerary: DailyPlan[];
  budgetBreakdown: BudgetBreakdown;
  hotelRecommendations: HotelRecommendation[];
  attractions: AttractionRecommendation[];
  travelTips: string[];
  weather: WeatherDay[];
}

export interface SavedTrip {
  id: number;
  source: string;
  destination: string;
  budget: number;
  days: number;
  travelers: number;
  interests: string[];
  generated_plan: TripPlan;
  created_at: string;
}

export interface TripGenerateInput {
  source: string;
  destination: string;
  days: number;
  budget: number;
  travelers: number;
  interests: string[];
}

export interface ChatHistoryItem {
  id: number;
  message: string;
  response: string;
  timestamp: string;
}

export const authApi = {
  register: async (data: any): Promise<User> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
  login: async (data: any): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },
  guest: async (): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/guest');
    return response.data;
  },
};

export const tripsApi = {
  generate: async (data: TripGenerateInput): Promise<TripPlan> => {
    const response = await api.post('/api/generate-trip', data);
    return response.data;
  },
  save: async (data: any): Promise<{ status: string; trip_id: number; message: string; trip: SavedTrip }> => {
    const response = await api.post('/api/trips/save', data);
    return response.data;
  },
  getHistory: async (): Promise<SavedTrip[]> => {
    const response = await api.get('/api/trips/history');
    return response.data;
  },
  delete: async (tripId: number): Promise<{ status: string; message: string }> => {
    const response = await api.delete(`/api/trips/${tripId}`);
    return response.data;
  },
  replan: async (tripId: number, changes: string): Promise<{ status: string; trip: SavedTrip }> => {
    const response = await api.post('/api/trips/replan', { trip_id: tripId, changes });
    return response.data;
  },
  update: async (data: { trip_id: number; budget: number; days: number; travelers: number; interests: string[]; generated_plan: TripPlan }): Promise<{ status: string; trip: SavedTrip }> => {
    const response = await api.post('/api/trips/update', data);
    return response.data;
  },
  searchFlights: async (params: { source: string; destination: string; departure_date: string; return_date?: string; passengers: number }): Promise<any[]> => {
    const response = await api.get('/api/flights/search', { params });
    return response.data;
  },
  searchHotels: async (destination: string): Promise<any[]> => {
    const response = await api.get('/api/hotels/search', { params: { destination } });
    return response.data;
  },
  calculateRoute: async (locations: any[]): Promise<any> => {
    const response = await api.post('/api/route/calculate', { locations });
    return response.data;
  },
  addExpense: async (data: { trip_id: number; category: string; amount: number; description?: string; spent_date?: string }): Promise<any> => {
    const response = await api.post('/api/expenses', data);
    return response.data;
  },
  getExpenses: async (tripId: number): Promise<any[]> => {
    const response = await api.get('/api/expenses', { params: { trip_id: tripId } });
    return response.data;
  },
  getProfile: async (): Promise<any> => {
    const response = await api.get('/api/profile');
    return response.data;
  },
  updateProfile: async (data: any): Promise<any> => {
    const response = await api.post('/api/profile', data);
    return response.data;
  },
  getNotifications: async (): Promise<any[]> => {
    const response = await api.get('/api/notifications');
    return response.data;
  },
  markNotificationsRead: async (): Promise<any> => {
    const response = await api.post('/api/notifications/read');
    return response.data;
  },
  createBooking: async (data: { trip_id: number; booking_type: string; provider_name: string; price: number; currency?: string; status?: string; payment_status?: string; details?: any }): Promise<any> => {
    const response = await api.post('/api/bookings', data);
    return response.data;
  },
  getBookings: async (tripId: number): Promise<any[]> => {
    const response = await api.get('/api/bookings', { params: { trip_id: tripId } });
    return response.data;
  },
  cancelBooking: async (bookingId: number): Promise<any> => {
    const response = await api.post(`/api/bookings/${bookingId}/cancel`);
    return response.data;
  },
  createPaymentIntent: async (data: { booking_id: number; gateway: string }): Promise<any> => {
    const response = await api.post('/api/payments/create', data);
    return response.data;
  },
  getPaymentHistory: async (): Promise<any[]> => {
    const response = await api.get('/api/payments/history');
    return response.data;
  },
  triggerMonitoringCheck: async (tripId: number): Promise<any> => {
    const response = await api.post('/api/monitoring/check', { trip_id: tripId });
    return response.data;
  },
  getAnalytics: async (): Promise<any> => {
    const response = await api.get('/api/analytics');
    return response.data;
  },
  getRecommendations: async (): Promise<any> => {
    const response = await api.get('/api/recommendations');
    return response.data;
  },
  getDemoItinerary: async (destination: string): Promise<any> => {
    const response = await api.get('/api/demo/itinerary', { params: { destination } });
    return response.data;
  },
  share: async (tripId: number): Promise<{ share_token: string; share_url: string }> => {
    const response = await api.post(`/api/trips/${tripId}/share`);
    return response.data;
  },
  getShared: async (token: string): Promise<SavedTrip> => {
    const response = await api.get(`/api/trips/share/${token}`);
    return response.data;
  },
  explore: async (data: { budget: number; season?: string; duration: number; moods: string[]; surprise_me?: boolean }): Promise<any[]> => {
    const response = await api.post('/api/explore', data);
    return response.data;
  },
};

export const aiApi = {
  chat: async (tripId: number, message: string): Promise<{ reply: string; message_id: number }> => {
    const response = await api.post('/api/chat', { trip_id: tripId, message });
    return response.data;
  },
  getChatHistory: async (tripId: number): Promise<ChatHistoryItem[]> => {
    const response = await api.get(`/api/chat/${tripId}`);
    return response.data;
  },
};

export default api;
