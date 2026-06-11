import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { tripsApi, SavedTrip, TripPlan } from '../services/api';
import { TripOverview } from '../components/TripOverview';
import { BudgetChart } from '../components/BudgetChart';
import { ItineraryCard } from '../components/ItineraryCard';
import { HotelCard } from '../components/HotelCard';
import { AttractionCard } from '../components/AttractionCard';
import { RouteMap } from '../components/RouteMap';
import { 
  Compass, Calendar, Wallet, MapPin, ArrowRight, Plus, 
  Trash2, Sparkles, Smile, RefreshCw, Save, MessageSquare, 
  X, AlertCircle, Sun, CloudRain, Users, Thermometer, Plane, CheckCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect if we are viewing the active trip results
  const isTripView = location.pathname === '/dashboard/trip';

  // Stats / Dashboard state
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Trip state
  const [activeTrip, setActiveTrip] = useState<SavedTrip | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Replanner Modal state
  const [showReplanModal, setShowReplanModal] = useState(false);
  const [replanBudget, setReplanBudget] = useState<number>(30000);
  const [replanDays, setReplanDays] = useState<number>(5);
  const [replanTravelers, setReplanTravelers] = useState<number>(1);
  const [replanWeather, setReplanWeather] = useState<string>('Rain');
  const [replanCustomText, setReplanCustomText] = useState<string>('');
  const [replanLoading, setReplanLoading] = useState(false);

  // Flights & Bookings States
  const [flights, setFlights] = useState<any[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);

  // Checkout & Payments states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<{ type: string; provider: string; price: number; details: any } | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'Stripe' | 'Razorpay'>('Stripe');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (activeTrip) {
      fetchFlights();
      fetchBookings();
    }
  }, [activeTrip]);

  const fetchFlights = async () => {
    if (!activeTrip) return;
    try {
      setFlightsLoading(true);
      const list = await tripsApi.searchFlights({
        source: activeTrip.source,
        destination: activeTrip.destination,
        departure_date: '2026-06-12',
        passengers: activeTrip.travelers
      });
      setFlights(list);
    } catch (err) {
      console.error("Failed to fetch flights:", err);
    } finally {
      setFlightsLoading(false);
    }
  };

  const fetchBookings = async () => {
    if (!activeTrip || activeTrip.id === 0) return;
    try {
      const list = await tripsApi.getBookings(activeTrip.id);
      setBookings(list);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    }
  };

  const handleBook = (type: string, provider: string, price: number, details: any) => {
    if (!activeTrip || activeTrip.id === 0) {
      setError("Please save this trip first to purchase bookings!");
      return;
    }
    setCheckoutItem({ type, provider, price, details });
    setSelectedGateway('Stripe');
    setPaymentResult(null);
    setCheckoutLoading(false);
    setShowCheckoutModal(true);
  };

  const executeCheckoutPayment = async () => {
    if (!activeTrip || !checkoutItem) return;
    setCheckoutLoading(true);
    setError('');
    try {
      // 1. Create a pending unpaid booking
      const newBooking = await tripsApi.createBooking({
        trip_id: activeTrip.id,
        booking_type: checkoutItem.type,
        provider_name: checkoutItem.provider,
        price: checkoutItem.price,
        status: 'Pending',
        payment_status: 'Unpaid',
        details: checkoutItem.details
      });

      // 2. Create payment intent/order on backend
      const paymentRes = await tripsApi.createPaymentIntent({
        booking_id: newBooking.id,
        gateway: selectedGateway
      });

      // Simulate network transition for high-fidelity gateway loader
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Trigger simulated webhook to succeed the payment intent
      const webhookPayload = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentRes.payment_intent.paymentIntentId || paymentRes.payment_intent.orderId,
            amount: checkoutItem.price
          }
        }
      };

      await api.post('/api/payments/webhook', webhookPayload);

      // Success: notify and refresh
      setPaymentResult({
        booking_reference: newBooking.booking_reference,
        confirmation_id: `FLY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      });
      fetchBookings();
    } catch (err) {
      console.error(err);
      setError("Secure checkout payment authorization failed.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancelLoading(bookingId);
    setError('');
    try {
      const result = await tripsApi.cancelBooking(bookingId);
      setError(`Booking cancelled successfully. Refund Status: ${result.refund_status}.`);
      fetchBookings();
      setTimeout(() => setError(''), 4000);
    } catch (err) {
      console.error(err);
      setError("Cancellation request failed.");
    } finally {
      setCancelLoading(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tripsApi.getHistory();
      setSavedTrips(data);
      
      // If viewing active trip, check if we have one in location state or local storage
      if (isTripView) {
        const stateTrip = location.state?.trip as SavedTrip | null;
        const generatedPlan = location.state?.generatedPlan as TripPlan | null;
        const originalInput = location.state?.originalInput as any;
        
        if (stateTrip) {
          setActiveTrip(stateTrip);
          setReplanBudget(stateTrip.budget);
          setReplanDays(stateTrip.days);
          setReplanTravelers(stateTrip.travelers);
          setSaveSuccess(true);
        } else if (generatedPlan && originalInput) {
          // Unsaved generated trip context
          const tempTrip: SavedTrip = {
            id: 0, // Unsaved
            source: originalInput.source,
            destination: originalInput.destination,
            budget: originalInput.budget,
            days: originalInput.days,
            travelers: originalInput.travelers,
            interests: originalInput.interests || [],
            generated_plan: generatedPlan,
            created_at: new Date().toISOString()
          };
          setActiveTrip(tempTrip);
          setReplanBudget(tempTrip.budget);
          setReplanDays(tempTrip.days);
          setReplanTravelers(tempTrip.travelers);
          setSaveSuccess(false);
        } else {
          // If no active trip is passed, redirect to planner
          navigate('/planner');
        }
      }
    } catch (err: any) {
      setError('Could not retrieve dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this trip from history?')) {
      try {
        await tripsApi.delete(id);
        setSavedTrips(prev => prev.filter(t => t.id !== id));
        if (activeTrip?.id === id) {
          navigate('/dashboard');
        }
      } catch (err) {
        alert('Failed to delete trip.');
      }
    }
  };

  const handleSaveTrip = async () => {
    if (!activeTrip) return;
    setSaveLoading(true);
    setError('');
    try {
      const payload = {
        source: activeTrip.source,
        destination: activeTrip.destination,
        budget: activeTrip.budget,
        days: activeTrip.days,
        travelers: activeTrip.travelers,
        interests: activeTrip.interests,
        generated_plan: activeTrip.generated_plan
      };
      const response = await tripsApi.save(payload);
      setSaveSuccess(true);
      setActiveTrip(response.trip);
      setError('Trip saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save trip.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReplanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || replanLoading) return;
    
    // Check if trip is saved. If not, we tell the user they must save it first (or we auto-save it, but prompt says "replan saved trip")
    if (activeTrip.id === 0) {
      setError('Please save this trip first before applying replanning.');
      setShowReplanModal(false);
      return;
    }

    setReplanLoading(true);
    setError('');
    
    // Construct replanning natural language instruction based on modal choices
    let instruction = `Replan parameters updated: `;
    if (replanBudget !== activeTrip.budget) instruction += `Change budget to ${replanBudget} INR. `;
    if (replanDays !== activeTrip.days) instruction += `Change trip duration to ${replanDays} days. `;
    if (replanTravelers !== activeTrip.travelers) instruction += `Change travelers count to ${replanTravelers}. `;
    if (replanWeather) instruction += `Weather condition updated to ${replanWeather}. `;
    if (replanCustomText.trim()) instruction += `Additional requirements: "${replanCustomText}".`;

    try {
      const response = await tripsApi.replan(activeTrip.id, instruction);
      setActiveTrip(response.trip);
      setShowReplanModal(false);
      setReplanCustomText('');
      setError('Trip replanned successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to replan trip.');
    } finally {
      setReplanLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand animate-spin"></div>
      </div>
    );
  }

  // RENDER TRIP PLAN RESULTS VIEW
  if (isTripView && activeTrip) {
    const plan = activeTrip.generated_plan;
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Error/Success Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-neutral-850 text-blue-650 dark:text-brand border border-blue-100 dark:border-neutral-800 rounded-2xl shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-900 p-6 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl">
          <div>
            <Link to="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-brand flex items-center gap-1 mb-1.5">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white">Your Copilot Itinerary</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!saveSuccess ? (
              <button
                onClick={handleSaveTrip}
                disabled={saveLoading}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-600 flex items-center justify-center gap-2 shadow-md shadow-brand/15 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Trip'}
              </button>
            ) : (
              <span className="flex-1 sm:flex-initial text-center px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/20">
                ✓ Saved to History
              </span>
            )}
            
            <button
              onClick={() => setShowReplanModal(true)}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-accent text-white font-bold text-sm hover:bg-accent-600 flex items-center justify-center gap-2 shadow-md shadow-accent/15 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Replan Trip
            </button>

            {saveSuccess && (
              <Link
                to="/chat"
                state={{ activeTrip }}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-205 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 transition-colors"
                title="Chat with Context"
              >
                <MessageSquare className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Overview, Timeline & Dining */}
          <div className="lg:col-span-8 space-y-8">
            <TripOverview trip={activeTrip} />

            {/* Route Map (Interactive Map) */}
            {activeTrip && activeTrip.id !== 0 && (
              <RouteMap 
                tripId={activeTrip.id} 
                itinerary={plan.dailyItinerary} 
                attractions={plan.attractions} 
                hotels={plan.hotelRecommendations} 
              />
            )}

            <ItineraryCard dailyPlan={plan.dailyItinerary} />

            {/* Recommended Flights Section */}
            {flights.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                  <Plane className="w-6 h-6 text-brand" /> Recommended Flights
                </h3>
                <div className="space-y-4">
                  {flights.map((flight, idx) => {
                    const isBooked = bookings.some(b => b.booking_type === 'Flight' && b.provider_name === flight.airline && b.details?.flightNumber === flight.flightNumber);
                    return (
                      <div key={idx} className="p-4 bg-slate-50/50 dark:bg-neutral-850/30 rounded-2xl border border-slate-150 dark:border-neutral-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-extrabold text-xs uppercase tracking-wider">
                            {flight.airline.slice(0, 3)}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Flight {flight.flightNumber}</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">{flight.airline}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6 text-xs w-full sm:w-auto">
                          <div>
                            <span className="text-slate-400 block mb-0.5">Depart</span>
                            <span className="font-bold text-slate-700 dark:text-neutral-300">{flight.departure}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Arrive</span>
                            <span className="font-bold text-slate-700 dark:text-neutral-300">{flight.arrival}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Stops</span>
                            <span className="font-bold text-slate-700 dark:text-neutral-300">{flight.stops} stop{flight.stops !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-150">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total Fare</span>
                            <span className="text-base font-extrabold text-slate-800 dark:text-white">{formatCurrency(flight.price)}</span>
                          </div>
                          {isBooked ? (
                            <span className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Booked
                            </span>
                          ) : (
                            <button
                              onClick={() => handleBook('Flight', flight.airline, flight.price, { flightNumber: flight.flightNumber, departure: flight.departure, arrival: flight.arrival })}
                              className="px-4 py-2.5 bg-brand hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                            >
                              Book Flight
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Hotels recommendations list */}
            <div>
              <h3 className="font-extrabold text-xl text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                🏨 Smart Hotel Matches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {plan.hotelRecommendations.map((hotel, index) => {
                  const isBooked = bookings.some(b => b.booking_type === 'Hotel' && b.provider_name === hotel.name);
                  return (
                    <HotelCard 
                      key={index} 
                      hotel={hotel} 
                      isBooked={isBooked}
                      onBook={() => handleBook('Hotel', hotel.name, 6500.0, { hotelName: hotel.name, price: hotel.pricePerNight })}
                    />
                  );
                })}
              </div>
            </div>

            {/* Attractions category view */}
            <AttractionCard attractions={plan.attractions} />
          </div>

          {/* Right: Budget Estimations & Tips */}
          <div className="lg:col-span-4 space-y-8">
            <BudgetChart breakdown={plan.budgetBreakdown} targetBudget={activeTrip.budget} />

            {/* Bookings & Tickets panel */}
            {activeTrip && activeTrip.id !== 0 && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                  🎟️ Booked Tickets & Reservations
                </h4>
                {bookings.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-neutral-500 py-2">
                    No active flight or hotel tickets purchased for this trip yet. Use the booking matches to checkout.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-4 bg-slate-50/50 dark:bg-neutral-850/30 rounded-2xl border border-slate-150 dark:border-neutral-800/60 text-xs space-y-2 relative group/item">
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase tracking-wider text-[9px] bg-brand/10 text-brand px-2 py-0.5 rounded">
                            {booking.booking_type}
                          </span>
                          <span className={`font-bold ${
                            booking.status === 'Cancelled' 
                              ? 'text-red-500' 
                              : booking.payment_status === 'Paid' 
                                ? 'text-emerald-500' 
                                : 'text-amber-500'
                          }`}>
                            {booking.status === 'Cancelled' ? 'Cancelled' : booking.payment_status}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-bold text-slate-700 dark:text-neutral-200 block text-xs truncate">{booking.provider_name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Ref: {booking.booking_reference || 'Pending'}</span>
                        </div>

                        {booking.confirmation_id && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded inline-block">
                            Conf ID: {booking.confirmation_id}
                          </p>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-neutral-800/65">
                          <span className="font-extrabold text-slate-700 dark:text-neutral-300">{formatCurrency(booking.price)}</span>
                          
                          {booking.status !== 'Cancelled' ? (
                            <button
                              disabled={cancelLoading === booking.id}
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-[10px] text-red-500 hover:text-red-700 font-bold hover:underline"
                            >
                              {cancelLoading === booking.id ? 'Cancelling...' : 'Cancel Reservation'}
                            </button>
                          ) : (
                            booking.refund_status !== 'None' && (
                              <span className="text-[10px] text-slate-400 italic font-medium">
                                Refund: {booking.refund_status}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tips Card */}
            {plan.travelTips && plan.travelTips.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-6 shadow-sm">
                <h4 className="font-bold text-base text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  💡 Travel Copilot Tips
                </h4>
                <ul className="space-y-3">
                  {plan.travelTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* REPLAN MODAL */}
        {showReplanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-black/70 animate-fade-in">
            <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-slate-100 dark:border-neutral-850 shadow-2xl overflow-hidden">
              <button
                onClick={() => setShowReplanModal(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-850 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-accent animate-spin-slow" /> Replan Trip Parameters
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Adjust preferences and let AI dynamically rewrite your itinerary, hotels, and budget breakdown.
                </p>
              </div>

              <form onSubmit={handleReplanSubmit} className="space-y-4">
                
                {/* Budget adjustment */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
                    Adjust Budget (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-450 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={replanBudget}
                      onChange={(e) => setReplanBudget(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Duration days */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
                      Trip Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={replanDays}
                      onChange={(e) => setReplanDays(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  
                  {/* Travelers count */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
                      Travelers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={replanTravelers}
                      onChange={(e) => setReplanTravelers(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>

                {/* Weather modifier */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
                    Weather Condition
                  </label>
                  <select
                    value={replanWeather}
                    onChange={(e) => setReplanWeather(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="Sunny">☀️ Sunny / Warm</option>
                    <option value="Rain">🌧️ Rainy / Monsoon</option>
                    <option value="Cloudy">☁️ Cloudy / Overcast</option>
                    <option value="Windy">💨 Windy / Autumn</option>
                    <option value="Snowy">❄️ Snowy / Winter</option>
                  </select>
                </div>

                {/* Free form natural language change */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1.5">
                    Additional Instructions (Optional)
                  </label>
                  <textarea
                    value={replanCustomText}
                    onChange={(e) => setReplanCustomText(e.target.value)}
                    placeholder="e.g. We want to skip beaches and focus on history. Or: Recommend vegetarian restaurants only."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-450 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={replanLoading}
                  className="w-full py-3.5 mt-3 rounded-xl font-bold bg-accent text-white hover:bg-accent-600 shadow-md shadow-accent/15 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {replanLoading ? 'Recalculating Plan...' : 'Regenerate Plan'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CHECKOUT MODAL */}
        {showCheckoutModal && checkoutItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-black/70 animate-fade-in">
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-slate-100 dark:border-neutral-850 shadow-2xl overflow-hidden">
              <button
                onClick={() => {
                  if (!checkoutLoading) setShowCheckoutModal(false);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 text-brand rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Secure Checkout
                </span>
                <h3 className="text-2xl font-bold text-slate-850 dark:text-white mt-2">
                  Confirm Reservation
                </h3>
              </div>

              {!paymentResult ? (
                <div className="space-y-6">
                  {/* Item Summary */}
                  <div className="p-4 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl border border-slate-150 dark:border-neutral-800/80 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-455 uppercase">
                      <span>Booking Type</span>
                      <span>Price</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{checkoutItem.provider}</h4>
                        <span className="text-[10px] text-slate-455 block uppercase font-medium tracking-wider mt-0.5">{checkoutItem.type} Selection</span>
                      </div>
                      <span className="text-base font-extrabold text-slate-800 dark:text-white">{formatCurrency(checkoutItem.price)}</span>
                    </div>
                  </div>

                  {/* Gateway selector */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                      Select Payment Gateway
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedGateway('Stripe')}
                        className={`py-3.5 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                          selectedGateway === 'Stripe'
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                            : 'border-slate-200 dark:border-neutral-800 bg-transparent text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-850/50'
                        }`}
                      >
                        <span className="text-sm">Stripe Gateway</span>
                        <span className="text-[9px] uppercase opacity-75">Global Payments</span>
                      </button>
                      
                      <button
                        onClick={() => setSelectedGateway('Razorpay')}
                        className={`py-3.5 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                          selectedGateway === 'Razorpay'
                            ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                            : 'border-slate-200 dark:border-neutral-800 bg-transparent text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-850/50'
                        }`}
                      >
                        <span className="text-sm">Razorpay</span>
                        <span className="text-[9px] uppercase opacity-75">UPI &amp; Netbanking</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkout Actions */}
                  {checkoutLoading ? (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-10 h-10 rounded-full border-2 border-slate-300 border-t-brand animate-spin mx-auto" />
                      <p className="text-xs text-slate-500 dark:text-neutral-400">Contacting secure gateway, authorizing payment...</p>
                    </div>
                  ) : (
                    <button
                      onClick={executeCheckoutPayment}
                      className="w-full py-4 rounded-2xl font-bold bg-brand text-white hover:bg-brand-600 shadow-md shadow-brand/15 text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Authorize &amp; Pay {formatCurrency(checkoutItem.price)}</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6 text-center animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-white text-lg">Transaction Succeeded!</h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Your secure booking has been finalized with the provider.</p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-neutral-850/60 rounded-2xl text-left text-[11px] space-y-1.5 border border-slate-100 dark:border-neutral-800/40">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gateway Provider:</span>
                      <span className="font-bold text-slate-700 dark:text-neutral-300">{selectedGateway}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Booking Reference:</span>
                      <span className="font-bold text-slate-700 dark:text-neutral-300">{paymentResult.booking_reference || 'BK-DEMO'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confirmation ID:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{paymentResult.confirmation_id || 'FLY-CONF'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Charged:</span>
                      <span className="font-bold text-slate-700 dark:text-neutral-300">{formatCurrency(checkoutItem.price)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setPaymentResult(null);
                    }}
                    className="w-full py-3 bg-brand text-white font-bold text-xs rounded-2xl hover:bg-brand-600 shadow-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  // RENDER MAIN USER OVERVIEW DASHBOARD
  const totalTrips = savedTrips.length;
  const totalBudget = savedTrips.reduce((sum, t) => sum + t.budget, 0);
  const totalDays = savedTrips.reduce((sum, t) => sum + t.days, 0);
  const uniqueDestinations = new Set(savedTrips.map(t => t.destination.toLowerCase())).size;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white flex items-center gap-2">
            Hi, {user?.name}! <Smile className="w-7 h-7 text-amber-500" />
          </h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm">
            Welcome to your travel command center.
          </p>
        </div>
        <Link
          to="/planner"
          className="px-5 py-3 bg-brand text-white font-semibold rounded-2xl shadow-md shadow-brand/15 hover:bg-brand-600 flex items-center gap-2 hover:-translate-y-0.5 transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Plan a New Trip
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
            <Compass className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Total Trips</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white mt-1">{totalTrips}</h3>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Allocated Budget</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white mt-1 truncate">{formatCurrency(totalBudget)}</h3>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Travel Days</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white mt-1">{totalDays} Days</h3>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">Destinations</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white mt-1">{uniqueDestinations} Cities</h3>
        </div>
      </div>

      {/* Saved Trips Lists */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-xl text-slate-850 dark:text-white">Your Travel History</h3>
          {totalTrips > 0 && (
            <Link to="/saved-trips" className="text-sm font-bold text-brand hover:underline flex items-center gap-1">
              View List <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {savedTrips.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-neutral-900 border border-dashed border-slate-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
            <Sparkles className="w-10 h-10 text-slate-300 dark:text-neutral-600 mx-auto mb-3" />
            <h4 className="font-bold text-slate-850 dark:text-white text-lg">No adventures planned yet</h4>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 mb-6 max-w-sm mx-auto">
              Ready to travel? Let our AI travel coordinator prepare a bespoke plan for you.
            </p>
            <Link
              to="/planner"
              className="px-6 py-3.5 bg-brand text-white font-semibold rounded-2xl shadow-md hover:bg-brand-600 transition-all text-sm inline-block"
            >
              Start Trip Planner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.slice(0, 3).map((trip) => (
              <div 
                key={trip.id} 
                className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-5 hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer relative"
                onClick={() => navigate('/dashboard/trip', { state: { trip } })}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-brand/10 text-brand px-3 py-1 rounded-xl text-xs font-bold uppercase">
                      {trip.days} Days
                    </span>
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="font-bold text-lg text-slate-855 dark:text-white line-clamp-1 group-hover:text-brand transition-colors">
                    {trip.destination}
                  </h4>
                  
                  <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> From {trip.source}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-neutral-850 pt-3">
                    <div>
                      <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">Budget</span>
                      <span className="font-bold text-slate-700 dark:text-neutral-300">{formatCurrency(trip.budget)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">Travelers</span>
                      <span className="font-bold text-slate-700 dark:text-neutral-300">{trip.travelers} Guests</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex justify-end">
                  <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    View full itinerary <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
