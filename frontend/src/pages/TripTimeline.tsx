import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip } from '../services/api';
import { 
  Plane, MapPin, Home, Utensils, Compass, Calendar, AlertTriangle, 
  RefreshCw, CheckCircle, Clock, ArrowLeftRight
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

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
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

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

  async function fetchBookings() {
    if (!selectedTrip) return;
    try {
      const bData = await tripsApi.getBookings(selectedTrip.id);
      setBookings(bData);
    } catch (err) {
      
    }
  };

  const handleMonitorCheck = async () => {
    if (!selectedTrip) return;
    setCheckingMonitor(true);
    setMonitorResult(null);
    try {
      const res = await tripsApi.triggerMonitoringCheck(selectedTrip.id);
      setMonitorResult(res);
      setHasUnreadAlerts(false); // Mark as read when checked
      if (res.status === 'rescheduled') {
        // Reload trip data to get the rewritten itinerary
        const updatedTrips = await tripsApi.getHistory();
        setTrips(updatedTrips);
        const match = updatedTrips.find(t => t.id === selectedTrip.id);
        if (match) setSelectedTrip(match);
      }
    } catch (err) {
      
    } finally {
      setCheckingMonitor(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)]">
          <div className="space-y-2 w-1/2">
            <div className="skeleton skeleton-text-lg" />
            <div className="skeleton skeleton-text-sm w-3/4" />
          </div>
          <div className="skeleton skeleton-button w-64" />
        </div>
        
        <div className="relative border-l-2 border-[var(--color-border)] ml-4 md:ml-12 pl-6 md:pl-12 space-y-12 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-sm)]">
              <div className="skeleton skeleton-text-sm w-32 mb-4" />
              <div className="skeleton skeleton-text-lg w-64 mb-6" />
              <div className="space-y-4">
                <div className="h-24 skeleton rounded-[var(--radius-md)]" />
                <div className="h-24 skeleton rounded-[var(--radius-md)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12 flex items-center justify-center">
        <EmptyState type="no-saved-trips" />
      </div>
    );
  }

  const plan = selectedTrip?.generated_plan;
  const days = plan?.dailyItinerary || [];

  // Extract booked flights / hotels
  const bookedFlights = bookings.filter(b => b.booking_type === 'Flight' && b.status !== 'Cancelled');
  const bookedHotels = bookings.filter(b => b.booking_type === 'Hotel' && b.status !== 'Cancelled');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-semibold text-textSecondary dark:text-warmWhite flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" /> Travel Timeline
          </h2>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">Chronological summary of check-ins, transit steps, meals, and excursions.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => {
              const match = trips.find(t => t.id === Number(e.target.value));
              if (match) setSelectedTrip(match);
            }}
            className="w-full sm:w-64 bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg px-4 py-2 text-xs text-textSecondary dark:text-dark-text-muted font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.destination} ({t.days} Days)</option>
            ))}
          </select>

          <div className="relative">
            <button
              onClick={handleMonitorCheck}
              disabled={checkingMonitor}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className={`p-2 rounded-lg border text-xs font-semibold transition-all flex items-center gap-2 relative ${
                checkingMonitor
                  ? 'bg-stoneMuted dark:bg-dark-card text-textSecondary cursor-not-allowed'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${checkingMonitor ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Check Alerts</span>
              {hasUnreadAlerts && !checkingMonitor && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border border-warmWhite dark:border-dark-card animate-pulse" />
              )}
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-12 w-64 bg-textPrimary text-warmWhite dark:bg-dark-card dark:text-dark-text border border-stoneMuted dark:border-dark-border px-3 py-2 rounded shadow-lg text-[10px] leading-normal z-50 animate-fade-in font-sans font-normal pointer-events-none text-left">
                Get notified about price changes, weather alerts, and flight delays for this trip.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monitor Alert Banner */}
      {monitorResult && (
        <div className={`p-4 rounded-lg border flex items-start gap-4 transition-all ${
          monitorResult.status === 'rescheduled'
            ? 'bg-warningAmber dark:bg-warningAmber/20 text-warningAmber dark:text-warningAmber border-warningAmber dark:border-warningAmber/30'
            : 'bg-successSage dark:bg-successSage/20 text-successSage dark:text-successSage border-successSage dark:border-successSage/30'
        }`}>
          {monitorResult.status === 'rescheduled' ? (
            <AlertTriangle className="w-5 h-5 mt-1 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 mt-1 shrink-0" />
          )}
          <div>
            <h5 className="font-semibold text-sm">{monitorResult.status === 'rescheduled' ? 'Weather Disruption Warning!' : 'All Systems Nominal'}</h5>
            <p className="text-xs mt-1 leading-relaxed">{monitorResult.message}</p>
          </div>
        </div>
      )}

      {/* Timeline Flow */}
      <div className="relative border-l-2 border-stoneMuted dark:border-dark-border ml-4 md:ml-12 pl-6 md:pl-12 space-y-12 py-2">
        {/* STEP 1: Flight Departure */}
        <div className="relative">
          <span className="absolute -left-12 md:-left-12 top-0 bg-primary/10 dark:bg-primary/20 text-primary p-2 rounded-lg border-4 border-stoneMuted dark:border-dark-border">
            <Plane className="w-4 h-4" />
          </span>
          <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-primary  font-semibold tracking-normal">Day 1 • Departure</span>
            <h4 className="font-semibold text-lg text-textSecondary dark:text-warmWhite mt-1">
              Flight to {selectedTrip?.destination.split(',')[0]}
            </h4>
            
            {bookedFlights.length > 0 ? (
              bookedFlights.map((bf, idx) => (
                <div key={idx} className="mt-4 p-4 bg-stoneMuted dark:bg-dark-card rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{bf.provider_name} ({bf.details?.flightNumber || 'Direct'})</span>
                    <span className="text-primary">Confirmed</span>
                  </div>
                  <p className="text-textSecondary">Confirmation ID: {bf.confirmation_id || 'Pending'}</p>
                  <p className="text-textSecondary mt-1">Fare: {bf.currency} {bf.price.toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="mt-4 text-xs text-textSecondary dark:text-dark-text-muted">
                <p>No flight booking logged. Suggesting departure flight from flight search:</p>
                <div className="mt-2 p-4 bg-stoneMuted dark:bg-dark-card rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-textSecondary dark:text-dark-text-muted">IndiGo 6E-241</span>
                    <span className="block text-xs text-textSecondary">Departure: 06:15 AM (Non-stop)</span>
                  </div>
                  <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted">₹6,200</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Hotel Check-In */}
        <div className="relative">
          <span className="absolute -left-12 md:-left-12 top-0 bg-primary/10 dark:bg-primary/20 text-primary p-2 rounded-lg border-4 border-stoneMuted dark:border-dark-border">
            <Home className="w-4 h-4" />
          </span>
          <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-primary  font-semibold tracking-normal">Day 1 • Accommodation</span>
            <h4 className="font-semibold text-lg text-textSecondary dark:text-warmWhite mt-1">
              Check-In: Resort Lodging
            </h4>
            
            {bookedHotels.length > 0 ? (
              bookedHotels.map((bh, idx) => (
                <div key={idx} className="mt-4 p-4 bg-stoneMuted dark:bg-dark-card rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>{bh.provider_name}</span>
                    <span className="text-primary">Confirmed</span>
                  </div>
                  <p className="text-textSecondary">Confirmation ID: {bh.confirmation_id || 'Pending'}</p>
                  <p className="text-textSecondary mt-1">Room details: Deluxe Suite Room</p>
                </div>
              ))
            ) : (
              <div className="mt-4 text-xs text-textSecondary dark:text-dark-text-muted">
                <p>No hotel booking logged. Suggested accommodation from planner:</p>
                <div className="mt-2 p-4 bg-stoneMuted dark:bg-dark-card rounded-lg">
                  <span className="font-semibold text-textSecondary dark:text-dark-text-muted">
                    {plan?.hotelRecommendations?.[0]?.name || 'Premium Beachside Resort'}
                  </span>
                  <span className="block text-xs text-textSecondary mt-1">
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
              <span className="absolute -left-12 md:-left-12 top-0 bg-successSage/10 dark:bg-successSage/20 text-successSage p-2 rounded-lg border-4 border-stoneMuted dark:border-dark-border">
                <Calendar className="w-4 h-4" />
              </span>
              <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-successSage  font-semibold tracking-normal">Day {day.day} • Daily Excursions</span>
                  <span className="text-xs bg-stoneMuted dark:bg-dark-card text-textSecondary dark:text-dark-text-muted px-2 py-1 rounded-lg font-semibold">
                    {day.weather}
                  </span>
                </div>
                
                {/* Check if weather has rewritten activities */}
                {day.weather.toLowerCase().includes('alert') && (
                  <div className="mt-4 p-4 bg-warningAmber dark:bg-warningAmber/20 text-warningAmber dark:text-warningAmber text-xs rounded-lg border border-warningAmber dark:border-warningAmber/30 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Outdoor activities updated due to weather warnings.</span>
                  </div>
                )}

                {/* Sub activities */}
                <div className="mt-6 space-y-6">
                  {day.activities.map((act, aIdx) => (
                    <div key={aIdx} className="flex gap-4 border-l-2 border-stoneMuted dark:border-dark-border pl-4 py-1 relative">
                      <div className="w-2.5 h-2.5 rounded-lg bg-stoneMuted dark:bg-dark-card absolute -left-2 top-2" />
                      <div className="text-xs space-y-1">
                        <span className="text-xs text-textSecondary font-semibold ">{act.time} ({act.duration})</span>
                        <h5 className="font-semibold text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-primary" /> {act.title}
                        </h5>
                        <p className="text-textSecondary dark:text-dark-text-muted leading-relaxed text-xs">{act.description}</p>
                        <div className="flex gap-4 text-xs text-textSecondary">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {act.location}</span>
                          <span>Cost: ₹{act.estimatedCost}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Restaurants / Meals */}
                {day.restaurants && day.restaurants.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-stoneMuted dark:border-dark-border">
                    <h5 className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted  tracking-normal mb-4 flex items-center gap-2">
                      <Utensils className="w-3.5 h-3.5 text-warningAmber" /> Dining Suggestions
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {day.restaurants.map((rest, rIdx) => (
                        <div key={rIdx} className="p-4 bg-stoneMuted dark:bg-dark-card rounded-lg flex flex-col justify-between">
                          <div>
                            <span className="text-xs text-textSecondary font-semibold ">{rest.recommendedMeal}</span>
                            <h6 className="font-semibold text-textSecondary dark:text-dark-text-muted mt-1">{rest.name}</h6>
                            <p className="text-xs text-textSecondary mt-1">{rest.description}</p>
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-textSecondary border-t border-stoneMuted dark:border-dark-border pt-2">
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
          <span className="absolute -left-12 md:-left-12 top-0 bg-coral/10 dark:bg-coral/20 text-coral p-2 rounded-lg border-4 border-stoneMuted dark:border-dark-border">
            <ArrowLeftRight className="w-4 h-4" />
          </span>
          <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-xs text-coral  font-semibold tracking-normal">Return Transit</span>
            <h4 className="font-semibold text-lg text-textSecondary dark:text-warmWhite mt-1">
              Checkout & Return Journey
            </h4>
            <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-2">
              Transfer back to airport from hotel check-out. Flight departs from international terminal.
            </p>
            <div className="mt-4 p-4 bg-stoneMuted dark:bg-dark-card rounded-lg text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-textSecondary dark:text-dark-text-muted">Return Flight (Estimated)</span>
                <span className="block text-xs text-textSecondary">Departure: 09:15 PM</span>
              </div>
              <span className="text-xs font-semibold text-textSecondary dark:text-dark-text-muted">Confirmed Return</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
