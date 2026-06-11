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
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TravelTips } from '../components/TravelTips';
import { MapWidget } from '../components/MapWidget';
import { 
  Compass, Calendar, Wallet, MapPin, ArrowRight, Plus, 
  Trash2, Sparkles, Smile, RefreshCw, Save, MessageSquare, 
  X, AlertCircle, Sun, CloudRain, Users, Thermometer, Plane, CheckCircle,
  Clock
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

  // Version history & Hotel view mode states
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [versionsList, setVersionsList] = useState<any[]>([]);
  const [previewingVersionId, setPreviewingVersionId] = useState<string | null>(null);
  const [originalPlanBeforePreview, setOriginalPlanBeforePreview] = useState<TripPlan | null>(null);
  const [hotelViewMode, setHotelViewMode] = useState<'list' | 'map'>('list');

  // Load versions whenever activeTrip changes
  useEffect(() => {
    if (activeTrip && activeTrip.id !== 0) {
      const stored = localStorage.getItem(`voira_trip_versions_${activeTrip.id}`);
      setVersionsList(stored ? JSON.parse(stored) : []);
    }
  }, [activeTrip]);

  const saveCurrentVersion = (trip: SavedTrip) => {
    if (!trip || trip.id === 0) return;
    const key = `voira_trip_versions_${trip.id}`;
    const stored = localStorage.getItem(key);
    const versions = stored ? JSON.parse(stored) : [];
    
    const newVersion = {
      versionId: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      plan: trip.generated_plan,
      budget: trip.budget,
      days: trip.days,
      travelers: trip.travelers,
      interests: trip.interests
    };
    
    versions.unshift(newVersion);
    localStorage.setItem(key, JSON.stringify(versions));
    setVersionsList(versions);
  };

  const handlePreviewVersion = (version: any) => {
    if (!activeTrip) return;
    if (!originalPlanBeforePreview) {
      setOriginalPlanBeforePreview(activeTrip.generated_plan);
    }
    setActiveTrip(prev => {
      if (!prev) return null;
      return {
        ...prev,
        budget: version.budget,
        days: version.days,
        travelers: version.travelers,
        interests: version.interests,
        generated_plan: version.plan
      };
    });
    setPreviewingVersionId(version.versionId);
    setShowVersionPanel(false);
  };

  const handleCancelPreview = () => {
    if (!activeTrip || !originalPlanBeforePreview) return;
    setActiveTrip(prev => {
      if (!prev || !originalPlanBeforePreview) return null;
      return {
        ...prev,
        generated_plan: originalPlanBeforePreview
      };
    });
    setOriginalPlanBeforePreview(null);
    setPreviewingVersionId(null);
  };

  const handleRestoreVersion = async (version: any) => {
    if (!activeTrip) return;
    setLoading(true);
    try {
      const res = await tripsApi.update({
        trip_id: activeTrip.id,
        budget: version.budget,
        days: version.days,
        travelers: version.travelers,
        interests: version.interests,
        generated_plan: version.plan
      });
      setActiveTrip(res.trip);
      setOriginalPlanBeforePreview(null);
      setPreviewingVersionId(null);
      setError('Itinerary restored to previous version successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to restore version to backend.');
    } finally {
      setLoading(false);
    }
  };


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

    // Save current plan version before replacing
    saveCurrentVersion(activeTrip);

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
        <div className="w-12 h-12 rounded-lg border-4 border-stoneMuted border-t-primary animate-spin"></div>
      </div>
    );
  }

  // RENDER TRIP PLAN RESULTS VIEW
  if (isTripView && activeTrip) {
    const plan = activeTrip.generated_plan;
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-6">
        
        {/* Error/Success Banner */}
        {error && (
          <div className="flex items-center gap-4 p-comfortable bg-primary/5 dark:bg-dark-elevated text-primary dark:text-primary border border-primary/20 dark:border-dark-border rounded-md shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-warmWhite dark:bg-dark-card p-6 border border-stoneMuted/50 dark:border-dark-border/40 rounded-lg">
          <div>
            <Link to="/dashboard" className="text-xs font-semibold text-textSecondary hover:text-primary flex items-center gap-1 mb-2">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-textPrimary dark:text-dark-text">Your Voira Itinerary</h1>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {!saveSuccess ? (
              <Button
                variant="primary"
                onClick={handleSaveTrip}
                disabled={saveLoading}
                className="flex-1 sm:flex-initial"
              >
                <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Trip'}
              </Button>
            ) : (
              <span className="flex-1 sm:flex-initial text-center px-4 py-2 bg-successSage/10 text-successSage font-semibold text-xs rounded-sm border border-successSage/20">
                ✓ Saved to History
              </span>
            )}
            
            <Button
              variant="destructive"
              onClick={() => setShowReplanModal(true)}
              className="flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-4 h-4" /> Regenerate Itinerary
            </Button>

            {saveSuccess && activeTrip && activeTrip.id !== 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  const stored = localStorage.getItem(`voira_trip_versions_${activeTrip.id}`);
                  setVersionsList(stored ? JSON.parse(stored) : []);
                  setShowVersionPanel(true);
                }}
                className="flex-1 sm:flex-initial"
              >
                <Clock className="w-4 h-4 text-textSecondary" /> Version History
              </Button>
            )}

            {saveSuccess && (
              <Link
                to="/chat"
                state={{ activeTrip }}
                className="h-9 w-9 rounded-sm bg-stoneMuted hover:bg-stoneMuted/80 text-textPrimary flex items-center justify-center transition-colors"
                title="Chat with Context"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Preview Alert Bar */}
        {previewingVersionId && (
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg flex items-center justify-between text-xs font-semibold text-primary animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>You are currently previewing an older version of this trip itinerary.</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const version = versionsList.find(v => v.versionId === previewingVersionId);
                  if (version) handleRestoreVersion(version);
                }}
              >
                Restore this Version
              </Button>
              <button
                onClick={handleCancelPreview}
                className="text-textSecondary hover:text-textPrimary dark:text-dark-text-muted dark:hover:text-dark-text hover:underline transition-all"
              >
                Cancel Preview
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Overview, Timeline & Dining */}
          <div className="lg:col-span-8 space-y-12">
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
              <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-lg p-6 shadow-xl space-y-4">
                <h3 className="font-sans font-semibold text-xl text-textPrimary dark:text-dark-text flex items-center gap-2">
                  <Plane className="w-5 h-5 text-primary" /> Recommended Flights
                </h3>
                <div className="space-y-4">
                  {flights.map((flight, idx) => {
                    const isBooked = bookings.some(b => b.booking_type === 'Flight' && b.provider_name === flight.airline && b.details?.flightNumber === flight.flightNumber);
                    return (
                      <div key={idx} className="p-4 bg-warmWhite/50 dark:bg-dark-elevated/30 rounded-md border border-stoneMuted dark:border-dark-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs  tracking-normal">
                            {flight.airline.slice(0, 3)}
                          </div>
                          <div>
                            <span className="text-xs text-textSecondary font-mono font-semibold block">Flight {flight.flightNumber}</span>
                            <span className="text-sm font-semibold text-textPrimary dark:text-dark-text">{flight.airline}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-6 text-xs w-full sm:w-auto">
                          <div>
                            <span className="text-textSecondary block mb-1">Depart</span>
                            <span className="font-semibold font-mono text-textPrimary dark:text-dark-text">{flight.departure}</span>
                          </div>
                          <div>
                            <span className="text-textSecondary block mb-1">Arrive</span>
                            <span className="font-semibold font-mono text-textPrimary dark:text-dark-text">{flight.arrival}</span>
                          </div>
                          <div>
                            <span className="text-textSecondary block mb-1">Stops</span>
                            <span className="font-semibold text-textPrimary dark:text-dark-text">{flight.stops} stop{flight.stops !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-stoneMuted">
                          <div>
                            <span className="text-xs text-textSecondary block">Total Fare</span>
                            <span className="text-base font-semibold text-coral font-mono">{formatCurrency(flight.price)}</span>
                          </div>
                          {isBooked ? (
                            <Badge type="verified" label="Booked" />
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() => handleBook('Flight', flight.airline, flight.price, { flightNumber: flight.flightNumber, departure: flight.departure, arrival: flight.arrival })}
                            >
                              Book Flight
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Hotels recommendations list */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-sans font-semibold text-xl text-textPrimary dark:text-dark-text flex items-center gap-2">
                  🏨 Smart Hotel Matches
                </h3>
                <div className="flex bg-stoneMuted/45 dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border rounded-md p-1 self-start sm:self-auto shadow-xs">
                  <button
                    onClick={() => setHotelViewMode('list')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all select-none ${
                      hotelViewMode === 'list'
                        ? 'bg-primary text-warmWhite shadow-sm'
                        : 'text-textSecondary hover:text-textPrimary dark:text-dark-text-muted dark:hover:text-dark-text bg-transparent'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setHotelViewMode('map')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all select-none ${
                      hotelViewMode === 'map'
                        ? 'bg-primary text-warmWhite shadow-sm'
                        : 'text-textSecondary hover:text-textPrimary dark:text-dark-text-muted dark:hover:text-dark-text bg-transparent'
                    }`}
                  >
                    Map View
                  </button>
                </div>
              </div>

              {hotelViewMode === 'list' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {plan.hotelRecommendations.map((hotel, index) => {
                    const isBooked = bookings.some(b => b.booking_type === 'Hotel' && b.provider_name === hotel.name);
                    return (
                      <HotelCard 
                        key={index} 
                        hotel={hotel} 
                        index={index}
                        isBooked={isBooked}
                        onBook={() => handleBook('Hotel', hotel.name, 6500.0, { hotelName: hotel.name, price: hotel.pricePerNight })}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-[450px] w-full rounded-lg overflow-hidden border border-stoneMuted/60 dark:border-dark-border/60 shadow-sm">
                  <MapWidget
                    destination={activeTrip.destination}
                    items={plan.hotelRecommendations.map(hotel => ({
                      name: hotel.name,
                      category: 'Hotel' as const
                    }))}
                    focusedIndex={null}
                    onMarkerClick={() => {}}
                    height="450px"
                  />
                </div>
              )}
            </div>

            {/* Attractions category view */}
            <AttractionCard attractions={plan.attractions} />
          </div>

          {/* Right: Budget Estimations & Tips */}
          <div className="lg:col-span-4 space-y-12">
            <BudgetChart breakdown={plan.budgetBreakdown} targetBudget={activeTrip.budget} />

            {/* Bookings & Tickets panel */}
            {activeTrip && activeTrip.id !== 0 && (
              <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted/60 dark:border-dark-border/60 rounded-lg p-6 shadow-sm space-y-4">
                <h4 className="font-sans font-semibold text-base text-textPrimary dark:text-dark-text flex items-center gap-2">
                  🎟️ Booked Tickets & Reservations
                </h4>
                {bookings.length === 0 ? (
                  <p className="text-xs text-textSecondary dark:text-dark-text-muted py-2">
                    No active flight or hotel tickets purchased for this trip yet. Use the booking matches to checkout.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-comfortable bg-warmWhite/50 dark:bg-dark-elevated/30 rounded-md border border-stoneMuted dark:border-dark-border/60 text-xs space-y-2 relative group/item hover:shadow-card-hover transition-all">
                        <div className="flex justify-between items-center">
                          <Badge type={booking.booking_type === 'Flight' ? 'direct' : 'recommender'} label={booking.booking_type} />
                          <span className={`font-semibold ${
                            booking.status === 'Cancelled' 
                              ? 'text-coral' 
                              : booking.payment_status === 'Paid' 
                                ? 'text-successSage' 
                                : 'text-warningAmber'
                          }`}>
                            {booking.status === 'Cancelled' ? 'Cancelled' : booking.payment_status}
                          </span>
                        </div>
                        
                        <div>
                          <span className="font-semibold text-textPrimary dark:text-dark-text block text-xs truncate">{booking.provider_name}</span>
                          <span className="text-xs text-textSecondary font-mono block mt-1">Ref: {booking.booking_reference || 'Pending'}</span>
                        </div>

                        {booking.confirmation_id && (
                          <p className="text-xs text-successSage font-semibold bg-successSage/10 px-2 py-1 rounded-sm inline-block">
                            Conf ID: {booking.confirmation_id}
                          </p>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-stoneMuted/50 dark:border-dark-border/65">
                          <span className="font-semibold text-coral font-mono">{formatCurrency(booking.price)}</span>
                          
                          {booking.status !== 'Cancelled' ? (
                            <button
                              disabled={cancelLoading === booking.id}
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-xs text-coral hover:text-coral font-semibold hover:underline"
                            >
                              {cancelLoading === booking.id ? 'Cancelling...' : 'Cancel Reservation'}
                            </button>
                          ) : (
                            booking.refund_status !== 'None' && (
                              <span className="text-xs text-textSecondary italic font-normal">
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
            <TravelTips 
              destination={activeTrip.destination} 
              startDate="2026-06-12"
            />
          </div>
        </div>

        {/* REPLAN MODAL */}
        {showReplanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stoneMuted backdrop-blur-sm dark:bg-textPrimary/70 animate-fade-in">
            <div className="relative w-full max-w-lg bg-warmWhite dark:bg-dark-card rounded-lg p-12 border border-stoneMuted dark:border-dark-border shadow-2xl overflow-hidden">
              <button
                onClick={() => setShowReplanModal(false)}
                className="absolute top-5 right-5 p-2 rounded-sm hover:bg-stoneMuted dark:hover:bg-stoneMuted text-textSecondary hover:text-textPrimary"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-2xl font-sans font-semibold text-textPrimary dark:text-warmWhite flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-coral animate-spin-slow" /> Regenerate Itinerary Parameters
                </h3>
                <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">
                  Adjust preferences and let AI dynamically rewrite your itinerary, hotels, and budget breakdown.
                </p>
              </div>

              <form onSubmit={handleReplanSubmit} className="space-y-4">
                
                {/* Budget adjustment */}
                <div>
                  <label className="block text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted mb-2">
                    Adjust Budget (INR)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={replanBudget ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(replanBudget) : ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setReplanBudget(val ? Number(val) : 0);
                      }}
                      className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-coral font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Duration days */}
                  <div>
                    <label className="block text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted mb-2">
                      Trip Days
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={replanDays}
                      onChange={(e) => setReplanDays(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-warmWhite text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  
                  {/* Travelers count */}
                  <div>
                    <label className="block text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted mb-2">
                      Travelers
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={replanTravelers}
                      onChange={(e) => setReplanTravelers(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-warmWhite text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Weather modifier */}
                <div>
                  <label className="block text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted mb-2">
                    Weather Condition
                  </label>
                  <select
                    value={replanWeather}
                    onChange={(e) => setReplanWeather(e.target.value)}
                    className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-warmWhite text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
                  <label className="block text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted mb-2">
                    Additional Instructions (Optional)
                  </label>
                  <textarea
                    value={replanCustomText}
                    onChange={(e) => setReplanCustomText(e.target.value)}
                    placeholder="e.g. We want to skip beaches and focus on history. Or: Recommend vegetarian restaurants only."
                    rows={3}
                    className="w-full px-4 py-2 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textPrimary dark:text-warmWhite text-xs placeholder:text-textSecondary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={replanLoading}
                  variant="destructive"
                  size="large"
                  className="w-full mt-4"
                >
                  {replanLoading ? 'Recalculating Plan...' : 'Regenerate Plan'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* VERSION HISTORY PANEL SIDE DRAWER */}
        {showVersionPanel && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-warmWhite dark:bg-dark-card h-full border-l border-stoneMuted dark:border-dark-border shadow-2xl p-8 flex flex-col justify-between animate-slide-left text-left font-sans">
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                <div className="flex justify-between items-center pb-4 border-b border-stoneMuted dark:border-dark-border">
                  <div>
                    <h3 className="text-xl font-semibold text-textPrimary dark:text-warmWhite flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> Version History
                    </h3>
                    <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">
                      Compare, preview, and restore previous iterations of your plan.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowVersionPanel(false)}
                    className="p-2 rounded-sm hover:bg-stoneMuted dark:hover:bg-stoneMuted text-textSecondary"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {versionsList.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <Clock className="w-10 h-10 text-textSecondary dark:text-dark-text-muted mx-auto mb-2 opacity-50" />
                      <h5 className="font-semibold text-textPrimary dark:text-warmWhite text-sm">No versions saved yet</h5>
                      <p className="text-xs text-textSecondary dark:text-dark-text-muted max-w-xs mx-auto leading-relaxed">
                        We save a version automatically before you regenerate or replan your itinerary.
                      </p>
                    </div>
                  ) : (
                    versionsList.map((version, vIdx) => (
                      <div 
                        key={version.versionId} 
                        className="p-4 bg-stoneMuted/30 dark:bg-dark-muted/10 border border-stoneMuted/65 dark:border-dark-border/60 rounded-md space-y-3 hover:shadow-sm transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-textPrimary dark:text-warmWhite">
                            Version {versionsList.length - vIdx}
                          </span>
                          <span className="text-[10px] text-textSecondary font-mono font-semibold">
                            {version.timestamp}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-textSecondary border-y border-stoneMuted/40 dark:border-dark-border/40 py-2">
                          <div>
                            <span className="block font-semibold">Budget</span>
                            <span className="font-mono text-coral font-bold">{formatCurrency(version.budget)}</span>
                          </div>
                          <div>
                            <span className="block font-semibold">Days</span>
                            <span className="font-bold text-textPrimary dark:text-dark-text">{version.days} Days</span>
                          </div>
                          <div>
                            <span className="block font-semibold">Guests</span>
                            <span className="font-bold text-textPrimary dark:text-dark-text">{version.travelers} Guests</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-1">
                          <button
                            onClick={() => handlePreviewVersion(version)}
                            className="text-[11px] font-bold text-primary hover:underline"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleRestoreVersion(version)}
                            className="text-[11px] font-bold text-coral hover:underline"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* CHECKOUT MODAL */}
        {showCheckoutModal && checkoutItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stoneMuted backdrop-blur-sm dark:bg-textPrimary/70 animate-fade-in">
            <div className="relative w-full max-w-md bg-warmWhite dark:bg-dark-card rounded-lg p-12 border border-stoneMuted dark:border-dark-border shadow-2xl overflow-hidden">
              <button
                onClick={() => {
                  if (!checkoutLoading) setShowCheckoutModal(false);
                }}
                className="absolute top-5 right-5 p-2 rounded-sm hover:bg-stoneMuted dark:hover:bg-stoneMuted text-textSecondary hover:text-textPrimary"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <Badge type="recommender" label="Secure Checkout" />
                <h3 className="text-2xl font-sans font-semibold text-textPrimary dark:text-warmWhite mt-2">
                  Confirm Reservation
                </h3>
              </div>

              {!paymentResult ? (
                <div className="space-y-6">
                  {/* Item Summary */}
                  <div className="p-comfortable bg-stoneMuted dark:bg-dark-card rounded-md border border-stoneMuted dark:border-dark-border space-y-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-textSecondary ">
                      <span>Booking Type</span>
                      <span>Price</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm text-textPrimary dark:text-warmWhite">{checkoutItem.provider}</h4>
                        <span className="text-xs text-textSecondary block  font-normal tracking-normal mt-1">{checkoutItem.type} Selection</span>
                      </div>
                      <span className="text-base font-semibold text-coral font-mono">{formatCurrency(checkoutItem.price)}</span>
                    </div>
                  </div>

                  {/* Gateway selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted">
                      Select Payment Gateway
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedGateway('Stripe')}
                        className={`py-4 rounded-sm border font-semibold text-xs flex flex-col items-center gap-1 transition-all ${
                          selectedGateway === 'Stripe'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-stoneMuted dark:border-dark-border bg-transparent text-textSecondary hover:bg-stoneMuted dark:hover:bg-stoneMuted'
                        }`}
                      >
                        <span className="text-sm">Stripe Gateway</span>
                        <span className="text-xs  opacity-75">Global Payments</span>
                      </button>
                      
                      <button
                        onClick={() => setSelectedGateway('Razorpay')}
                        className={`py-4 rounded-sm border font-semibold text-xs flex flex-col items-center gap-1 transition-all ${
                          selectedGateway === 'Razorpay'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-stoneMuted dark:border-dark-border bg-transparent text-textSecondary hover:bg-stoneMuted dark:hover:bg-stoneMuted'
                        }`}
                      >
                        <span className="text-sm">Razorpay</span>
                        <span className="text-xs  opacity-75">UPI &amp; Netbanking</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkout Actions */}
                  {checkoutLoading ? (
                    <div className="text-center py-6 space-y-4">
                      <div className="w-10 h-10 rounded-lg border-2 border-stoneMuted border-t-primary animate-spin mx-auto" />
                      <p className="text-xs text-textSecondary dark:text-dark-text-muted">Contacting secure gateway, authorizing payment...</p>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="large"
                      onClick={executeCheckoutPayment}
                      className="w-full"
                    >
                      Authorize &amp; Pay <span className="font-mono text-coral font-semibold">{formatCurrency(checkoutItem.price)}</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6 text-center animate-fade-in">
                  <div className="w-12 h-12 rounded-lg bg-successSage/10 text-successSage flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-sans font-semibold text-textPrimary dark:text-warmWhite text-lg">Transaction Succeeded!</h4>
                    <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">Your secure booking has been finalized with the provider.</p>
                  </div>

                  <div className="p-comfortable bg-stoneMuted dark:bg-dark-card rounded-md text-left text-xs space-y-2 border border-stoneMuted dark:border-dark-border">
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Gateway Provider:</span>
                      <span className="font-semibold text-textPrimary dark:text-dark-text-muted">{selectedGateway}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Booking Reference:</span>
                      <span className="font-semibold text-textPrimary dark:text-dark-text-muted">{paymentResult.booking_reference || 'BK-DEMO'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Confirmation ID:</span>
                      <span className="font-semibold text-successSage">{paymentResult.confirmation_id || 'FLY-CONF'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textSecondary">Amount Charged:</span>
                      <span className="font-semibold text-coral font-mono">{formatCurrency(checkoutItem.price)}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowCheckoutModal(false);
                      setPaymentResult(null);
                    }}
                    className="w-full"
                  >
                    Done
                  </Button>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-sans font-semibold text-textPrimary dark:text-warmWhite flex items-center gap-2">
            Hi, {user?.name}! <Smile className="w-7 h-7 text-warningAmber" />
          </h2>
          <p className="text-textSecondary dark:text-dark-text-muted text-sm">
            Welcome to your travel command center.
          </p>
        </div>
        <Link
          to="/planner"
          className="h-11 px-6 bg-primary text-warmWhite font-semibold rounded-sm shadow-sm hover:opacity-95 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.99] transition-all text-sm"
        >
          <Plus className="w-4 h-4" /> Plan a New Trip
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Compass className="w-5 h-5" />
          </div>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold  tracking-normal">Total Trips</p>
          <h3 className="text-2xl sm:text-3xl font-semibold text-textPrimary dark:text-warmWhite mt-1">{totalTrips} {totalTrips === 1 ? 'Trip' : 'Trips'}</h3>
        </div>

        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-md bg-successSage/10 text-successSage flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold  tracking-normal">Allocated Budget</p>
          <h3 className="text-2xl sm:text-3xl font-semibold text-coral font-mono mt-1 truncate">{formatCurrency(totalBudget)}</h3>
        </div>

        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-md bg-coral/10 text-coral dark:text-coral flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold  tracking-normal">Travel Days</p>
          <h3 className="text-2xl sm:text-3xl font-semibold text-textPrimary dark:text-warmWhite mt-1">{totalDays} {totalDays === 1 ? 'Day' : 'Days'}</h3>
        </div>

        <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border p-6 rounded-md shadow-sm hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-md bg-coral/10 text-coral dark:text-coral flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted font-semibold  tracking-normal">Destinations</p>
          <h3 className="text-2xl sm:text-3xl font-semibold text-textPrimary dark:text-warmWhite mt-1">{uniqueDestinations} {uniqueDestinations === 1 ? 'City' : 'Cities'}</h3>
        </div>
      </div>

      {/* Saved Trips Lists */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-sans font-semibold text-xl text-textPrimary dark:text-warmWhite">Your Travel History</h3>
          {totalTrips > 0 && (
            <Link to="/saved-trips" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
              View List <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {savedTrips.length === 0 ? (
          <div className="text-center py-20 bg-warmWhite dark:bg-dark-card border border-dashed border-stoneMuted dark:border-dark-border rounded-md p-12 shadow-sm">
            <Sparkles className="w-10 h-10 text-textSecondary dark:text-dark-text-muted mx-auto mb-4" />
            <h4 className="font-sans font-semibold text-textPrimary dark:text-warmWhite text-lg">No adventures planned yet</h4>
            <p className="text-sm text-textSecondary dark:text-dark-text-muted mt-1 mb-6 max-w-sm mx-auto">
              Ready to travel? Let our AI travel coordinator prepare a bespoke plan for you.
            </p>
            <Link
              to="/planner"
              className="h-11 px-6 bg-primary text-warmWhite font-semibold rounded-sm shadow-sm hover:opacity-95 inline-flex items-center justify-center transition-all text-sm animate-pulse-subtle"
            >
              Start Trip Planner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.slice(0, 3).map((trip) => (
              <div 
                key={trip.id} 
                className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-md p-6 hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all flex flex-col justify-between group cursor-pointer relative"
                onClick={() => navigate('/dashboard/trip', { state: { trip } })}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <Badge type="duration" label={`${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}`} />
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      className="p-2 rounded-sm text-textSecondary hover:text-coral hover:bg-coral/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Delete trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="font-sans font-semibold text-lg text-textPrimary dark:text-warmWhite line-clamp-1 group-hover:text-primary transition-colors">
                    {trip.destination}
                  </h4>
                  
                  <p className="text-xs text-textSecondary dark:text-dark-text-muted flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4 text-primary" /> From {trip.source}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-stoneMuted dark:border-dark-border pt-4">
                    <div>
                      <span className="text-textSecondary block mb-1">Budget</span>
                      <span className="font-semibold text-coral font-mono">{formatCurrency(trip.budget)}</span>
                    </div>
                    <div>
                      <span className="text-textSecondary block mb-1">Travelers</span>
                      <span className="font-semibold text-textPrimary dark:text-dark-text-muted">{trip.travelers} Guests</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 flex justify-end">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
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
