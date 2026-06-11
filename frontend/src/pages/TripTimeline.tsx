import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip, DailyPlan, Activity, Restaurant } from '../services/api';
import { 
  Plane, MapPin, Home, Utensils, Compass, Calendar, AlertTriangle, 
  RefreshCw, CheckCircle, Clock, ArrowLeftRight, Navigation
} from 'lucide-react';

export const TripTimeline: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingMonitor, setCheckingMonitor] = useState(false);
  const [monitorResult, setMonitorResult] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchTripsData();
  }, [isAuthenticated]);

  const fetchTripsData = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getHistory();
      setTrips(data);
      
      const stateTrip = location.state?.trip as SavedTrip | null;
      if (stateTrip) {
        const match = data.find(t => t.id === stateTrip.id);
        setSelectedTrip(match || stateTrip);
      } else if (data.length > 0) {
        setSelectedTrip(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTrip) {
      fetchBookings();
      setMonitorResult(null);
    }
  }, [selectedTrip]);

  const fetchBookings = async () => {
    if (!selectedTrip) return;
    try {
      const bData = await tripsApi.getBookings(selectedTrip.id);
      setBookings(bData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMonitorCheck = async () => {
    if (!selectedTrip) return;
    setCheckingMonitor(true);
    setMonitorResult(null);
    try {
      const res = await tripsApi.triggerMonitoringCheck(selectedTrip.id);
      setMonitorResult(res);
      if (res.status === 'rescheduled') {
        // Reload trip data to get the rewritten itinerary
        const updatedTrips = await tripsApi.getHistory();
        setTrips(updatedTrips);
        const match = updatedTrips.find(t => t.id === selectedTrip.id);
        if (match) setSelectedTrip(match);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingMonitor(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand animate-spin"></div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="max-w-md mx-auto my-20 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
        <Compass className="w-12 h-12 text-slate-350 mx-auto mb-3" />
        <h4 className="font-bold text-slate-800 dark:text-white text-lg">No active trips found</h4>
        <p className="text-sm text-slate-500 dark:text-neutral-450 mt-1 mb-6 leading-relaxed">
          Create and save a trip plan to view its daily chronological journey timeline.
        </p>
        <button onClick={() => navigate('/planner')} className="px-6 py-3.5 bg-brand text-white font-semibold rounded-2xl shadow-md hover:bg-brand-600 transition-all text-sm">
          Plan a Trip
        </button>
      </div>
    );
  }

  const plan = selectedTrip?.generated_plan;
  const days = plan?.dailyItinerary || [];

  // Extract booked flights / hotels
  const bookedFlights = bookings.filter(b => b.booking_type === 'Flight' && b.status !== 'Cancelled');
  const bookedHotels = bookings.filter(b => b.booking_type === 'Hotel' && b.status !== 'Cancelled');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand" /> Travel Timeline
          </h2>
          <p className="text-xs text-slate-450 dark:text-neutral-500 mt-1">Chronological summary of check-ins, transit steps, meals, and excursions.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => {
              const match = trips.find(t => t.id === Number(e.target.value));
              if (match) setSelectedTrip(match);
            }}
            className="w-full sm:w-64 bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-neutral-300 font-bold focus:outline-none focus:ring-1 focus:ring-brand"
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.destination} ({t.days} Days)</option>
            ))}
          </select>

          <button
            onClick={handleMonitorCheck}
            disabled={checkingMonitor}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              checkingMonitor
                ? 'bg-slate-100 dark:bg-neutral-800 text-slate-400 cursor-not-allowed'
                : 'bg-brand/10 hover:bg-brand/20 text-brand border-brand/20'
            }`}
            title="Trigger real-time flight and weather monitoring check"
          >
            <RefreshCw className={`w-4 h-4 ${checkingMonitor ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Check Alerts</span>
          </button>
        </div>
      </div>

      {/* Monitor Alert Banner */}
      {monitorResult && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
          monitorResult.status === 'rescheduled'
            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
        }`}>
          {monitorResult.status === 'rescheduled' ? (
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          )}
          <div>
            <h5 className="font-extrabold text-sm">{monitorResult.status === 'rescheduled' ? 'Weather Disruption Warning!' : 'All Systems Nominal'}</h5>
            <p className="text-xs mt-0.5 leading-relaxed">{monitorResult.message}</p>
          </div>
        </div>
      )}

      {/* Timeline Flow */}
      <div className="relative border-l-2 border-slate-150 dark:border-neutral-850 ml-4 md:ml-8 pl-6 md:pl-10 space-y-12 py-2">
        {/* STEP 1: Flight Departure */}
        <div className="relative">
          <span className="absolute -left-[35px] md:-left-[51px] top-0 bg-brand/10 dark:bg-brand/20 text-brand p-2 rounded-full border-4 border-slate-50 dark:border-neutral-950">
            <Plane className="w-4 h-4" />
          </span>
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] text-brand uppercase font-extrabold tracking-wider">Day 1 • Departure</span>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white mt-1">
              Flight to {selectedTrip?.destination.split(',')[0]}
            </h4>
            
            {bookedFlights.length > 0 ? (
              bookedFlights.map((bf, idx) => (
                <div key={idx} className="mt-3 p-4 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{bf.provider_name} ({bf.details?.flightNumber || 'Direct'})</span>
                    <span className="text-brand">Confirmed</span>
                  </div>
                  <p className="text-slate-400">Confirmation ID: {bf.confirmation_id || 'Pending'}</p>
                  <p className="text-slate-500 mt-1">Fare: {bf.currency} {bf.price.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="mt-3 text-xs text-slate-500 dark:text-neutral-400">
                <p>No flight booking logged. Suggesting departure flight from flight search:</p>
                <div className="mt-2 p-3.5 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-neutral-300">IndiGo 6E-241</span>
                    <span className="block text-[10px] text-slate-400">Departure: 06:15 AM (Non-stop)</span>
                  </div>
                  <span className="text-xs font-extrabold text-slate-650 dark:text-neutral-300">₹6,200</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Hotel Check-In */}
        <div className="relative">
          <span className="absolute -left-[35px] md:-left-[51px] top-0 bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 p-2 rounded-full border-4 border-slate-50 dark:border-neutral-950">
            <Home className="w-4 h-4" />
          </span>
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] text-blue-500 uppercase font-extrabold tracking-wider">Day 1 • Accommodation</span>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white mt-1">
              Check-In: Resort Lodging
            </h4>
            
            {bookedHotels.length > 0 ? (
              bookedHotels.map((bh, idx) => (
                <div key={idx} className="mt-3 p-4 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>{bh.provider_name}</span>
                    <span className="text-brand">Confirmed</span>
                  </div>
                  <p className="text-slate-400">Confirmation ID: {bh.confirmation_id || 'Pending'}</p>
                  <p className="text-slate-500 mt-1">Room details: Deluxe Suite Room</p>
                </div>
              ))
            ) : (
              <div className="mt-3 text-xs text-slate-500 dark:text-neutral-400">
                <p>No hotel booking logged. Suggested accommodation from planner:</p>
                <div className="mt-2 p-3.5 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl">
                  <span className="font-bold text-slate-700 dark:text-neutral-300">
                    {plan?.hotelRecommendations?.[0]?.name || 'Premium Beachside Resort'}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    Rating: {plan?.hotelRecommendations?.[0]?.rating || '4.5/5'} • {plan?.hotelRecommendations?.[0]?.pricePerNight || 'Mid-range'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: Daily Activity timeline */}
        {days.map((day) => (
          <div key={day.day} className="space-y-6">
            {/* Day Header Marker */}
            <div className="relative">
              <span className="absolute -left-[35px] md:-left-[51px] top-0 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 p-2 rounded-full border-4 border-slate-50 dark:border-neutral-950">
                <Calendar className="w-4 h-4" />
              </span>
              <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald-500 uppercase font-extrabold tracking-wider">Day {day.day} • Daily Excursions</span>
                  <span className="text-xs bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 px-2.5 py-0.5 rounded-lg font-bold">
                    {day.weather}
                  </span>
                </div>
                
                {/* Check if weather has rewritten activities */}
                {day.weather.toLowerCase().includes('alert') && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-xs rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Outdoor activities updated due to weather warnings.</span>
                  </div>
                )}

                {/* Sub activities */}
                <div className="mt-5 space-y-5">
                  {day.activities.map((act, aIdx) => (
                    <div key={aIdx} className="flex gap-4 border-l-2 border-slate-100 dark:border-neutral-800 pl-4 py-1 relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-neutral-700 absolute -left-[6px] top-2" />
                      <div className="text-xs space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">{act.time} ({act.duration})</span>
                        <h5 className="font-extrabold text-slate-700 dark:text-neutral-200 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-brand" /> {act.title}
                        </h5>
                        <p className="text-slate-500 dark:text-neutral-400 leading-relaxed text-[11px]">{act.description}</p>
                        <div className="flex gap-4 text-[10px] text-slate-400">
                          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {act.location}</span>
                          <span>Cost: ₹{act.estimatedCost}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Restaurants / Meals */}
                {day.restaurants && day.restaurants.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-neutral-850">
                    <h5 className="text-xs font-extrabold text-slate-650 dark:text-neutral-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-orange-400" /> Dining Suggestions
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {day.restaurants.map((rest, rIdx) => (
                        <div key={rIdx} className="p-3 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{rest.recommendedMeal}</span>
                            <h6 className="font-bold text-slate-700 dark:text-neutral-200 mt-0.5">{rest.name}</h6>
                            <p className="text-[10px] text-slate-500 mt-1">{rest.description}</p>
                          </div>
                          <div className="mt-2.5 flex justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-neutral-800/80 pt-1.5">
                            <span>{rest.cuisine}</span>
                            <span>Est: ₹{rest.estimatedCost}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* STEP 4: Return Journey */}
        <div className="relative">
          <span className="absolute -left-[35px] md:-left-[51px] top-0 bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 p-2 rounded-full border-4 border-slate-50 dark:border-neutral-950">
            <ArrowLeftRight className="w-4 h-4" />
          </span>
          <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-[10px] text-purple-500 uppercase font-extrabold tracking-wider">Return Transit</span>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white mt-1">
              Checkout & Return Journey
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-2">
              Transfer back to airport from hotel check-out. Flight departs from international terminal.
            </p>
            <div className="mt-4 p-3.5 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-700 dark:text-neutral-300">Return Flight (Estimated)</span>
                <span className="block text-[10px] text-slate-400">Departure: 09:15 PM</span>
              </div>
              <span className="text-xs font-extrabold text-slate-550 dark:text-neutral-300">Confirmed Return</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
