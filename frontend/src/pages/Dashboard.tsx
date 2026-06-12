import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import api, { tripsApi, SavedTrip, TripPlan } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import { BudgetChart } from '../components/BudgetChart';
import { ItineraryCard } from '../components/ItineraryCard';
import { HotelCard } from '../components/HotelCard';
import { AttractionCard } from '../components/AttractionCard';
import { FlightRow } from '../components/FlightRow';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TravelTips } from '../components/TravelTips';
import { MapWidget } from '../components/MapWidget';
import { PackingList } from '../components/PackingList';
import { 
  Compass, Calendar, Wallet, MapPin, ArrowRight, Plus, 
  Trash2, Sparkles, RefreshCw, Save, MessageSquare, 
  X, AlertCircle, Plane, CheckCircle,
  Clock, Share2, FileText, CalendarRange, Building2
} from 'lucide-react';

interface TripVersion {
  versionId: string;
  timestamp: string;
  plan: TripPlan;
  budget: number;
  days: number;
  travelers: number;
  interests: string[];
}

interface BudgetCopilotFlag {
  category: string;
  spent: number;
  planned: number;
  deviation: number;
}

interface BudgetCopilotData {
  comment: string;
  flags: BudgetCopilotFlag[];
  recommendations: string[];
}

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
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
  const [versionsList, setVersionsList] = useState<TripVersion[]>([]);
  const [previewingVersionId, setPreviewingVersionId] = useState<string | null>(null);
  const [originalPlanBeforePreview, setOriginalPlanBeforePreview] = useState<TripPlan | null>(null);
  const [hotelViewMode, setHotelViewMode] = useState<'list' | 'map'>('list');

  // Load versions whenever activeTrip changes
  useEffect(() => {
    let isMounted = true;
    if (activeTrip && activeTrip.id !== 0) {
      setTimeout(() => {
        if (isMounted) {
          const stored = localStorage.getItem(`voira_trip_versions_${activeTrip.id}`);
          setVersionsList(stored ? JSON.parse(stored) : []);
        }
      }, 0);
    }
    return () => {
      isMounted = false;
    };
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

  const handlePreviewVersion = (version: TripVersion) => {
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

  const handleRestoreVersion = async (version: TripVersion) => {
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
    } catch {
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
  const [flights, setFlights] = useState<unknown[]>([]);
  const [flightsLoading, setFlightsLoading] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [flightSortKey, setFlightSortKey] = useState<'price' | 'duration' | 'departure'>('price');
  const [bookings, setBookings] = useState<unknown[]>([]);
  const [budgetCopilot, setBudgetCopilot] = useState<BudgetCopilotData | null>(null);

  const [activeTab, setActiveTab] = useState<'budget' | 'packing' | 'tips'>('budget');

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<{ type: string; provider: string; price: number; details: unknown } | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'Stripe' | 'Razorpay'>('Stripe');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<unknown>(null);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  const fetchBudgetCopilot = useCallback(async () => {
    if (!activeTrip || activeTrip.id === 0) return;
    try {
      const response = await api.get(`/api/trips/${activeTrip.id}/budget-copilot`);
      setBudgetCopilot(response.data);
    } catch {
      // Ignored
    }
  }, [activeTrip]);

  const fetchFlights = useCallback(async () => {
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
    } catch {
      // Ignored
    } finally {
      setFlightsLoading(false);
    }
  }, [activeTrip]);

  const fetchBookings = useCallback(async () => {
    if (!activeTrip || activeTrip.id === 0) return;
    try {
      const list = await tripsApi.getBookings(activeTrip.id);
      setBookings(list);
    } catch {
      // Ignored
    }
  }, [activeTrip]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await tripsApi.getHistory();
      setSavedTrips(data);
      
      // If viewing active trip, check if we have one in location state or local storage
      if (isTripView) {
        const stateTrip = location.state?.trip as SavedTrip | null;
        const generatedPlan = location.state?.generatedPlan as TripPlan | null;
        const originalInput = location.state?.originalInput as Record<string, unknown> | null;
        
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
            source: (originalInput.source as string) || '',
            destination: (originalInput.destination as string) || '',
            budget: (originalInput.budget as number) || 0,
            days: (originalInput.days as number) || 5,
            travelers: (originalInput.travelers as number) || 1,
            interests: (originalInput.interests as string[]) || [],
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
    } catch {
      setError('Could not retrieve dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [isTripView, location.state, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, navigate, fetchDashboardData]);

  useEffect(() => {
    if (activeTrip) {
      fetchFlights();
      fetchBookings();
      fetchBudgetCopilot();
    }
  }, [activeTrip, fetchFlights, fetchBookings, fetchBudgetCopilot]);

  const downloadPDF = () => {
    if (!activeTrip || activeTrip.id === 0) return;
    window.open(`${API_BASE_URL}/api/trips/${activeTrip.id}/pdf`, '_blank');
  };

  const downloadCalendar = () => {
    if (!activeTrip || activeTrip.id === 0) return;
    window.open(`${API_BASE_URL}/api/trips/${activeTrip.id}/calendar`, '_blank');
  };

  const handleShare = async () => {
    if (!activeTrip || activeTrip.id === 0) return;
    setShareLoading(true);
    try {
      const res = await tripsApi.share(activeTrip.id);
      const shareUrl = `${window.location.origin}/share/${res.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      setError(`✓ Public share link copied to clipboard: ${shareUrl}`);
      setTimeout(() => setError(''), 8000);
    } catch {
      setError("Failed to generate public share token.");
      setTimeout(() => setError(''), 4000);
    } finally {
      setShareLoading(false);
    }
  };

  const handleBook = (type: string, provider: string, price: number, details: unknown) => {
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
      }) as { id: number; booking_reference: string };

      // 2. Create payment intent/order on backend
      const paymentRes = await tripsApi.createPaymentIntent({
        booking_id: newBooking.id,
        gateway: selectedGateway
      }) as { payment_intent: { paymentIntentId?: string; orderId?: string } };

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
      fetchBudgetCopilot();
    } catch {
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
      const result = await tripsApi.cancelBooking(bookingId) as { refund_status: string };
      setError(`Booking cancelled successfully. Refund Status: ${result.refund_status}.`);
      fetchBookings();
      setTimeout(() => setError(''), 4000);
    } catch {
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
        const originalInput = location.state?.originalInput as Record<string, unknown> | null;
        
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
            source: (originalInput.source as string) || '',
            destination: (originalInput.destination as string) || '',
            budget: (originalInput.budget as number) || 0,
            days: (originalInput.days as number) || 5,
            travelers: (originalInput.travelers as number) || 1,
            interests: (originalInput.interests as string[]) || [],
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
    } catch {
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
      } catch {
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
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to save trip.');
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
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to replan trip.');
    } finally {
      setReplanLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return formatPrice(val);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12 bg-[var(--color-bg-page)]">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="skeleton skeleton-text-lg w-64" />
            <div className="skeleton skeleton-text-sm w-48" />
          </div>
          <div className="skeleton skeleton-button" />
        </div>

        {/* Stats Cards Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)]">
              <div className="w-10 h-10 rounded-[var(--radius-md)] skeleton mb-4" />
              <div className="skeleton skeleton-text-xs w-24 mb-2" />
              <div className="skeleton skeleton-text-lg w-16" />
            </div>
          ))}
        </div>

        {/* List Skeleton */}
        <div className="space-y-6">
          <div className="skeleton skeleton-text-lg w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-[var(--radius-lg)] skeleton" />
            ))}
          </div>
        </div>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-bg-card)] p-6 border border-[var(--color-border)] rounded-[var(--radius-lg)]">
          <div>
            <Link to="/dashboard" className="btn-ghost mb-2 -ml-3.5">
              ← Back to Dashboard
            </Link>
            <h1 className="page-title">Your voira Itinerary</h1>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {!saveSuccess ? (
              <button
                onClick={handleSaveTrip}
                disabled={saveLoading}
                className="btn-primary flex-1 sm:flex-initial"
              >
                <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Trip'}
              </button>
            ) : (
              <span className="flex-1 sm:flex-initial text-center px-4 py-2 bg-[var(--color-success-bg)] text-[var(--color-success)] font-bold text-[10px] uppercase tracking-wider rounded-[var(--radius-sm)] border border-[var(--color-success-border)]">
                ✓ Saved to History
              </span>
            )}
            
            <Button
              variant="secondary"
              onClick={() => setShowReplanModal(true)}
              className="flex-1 sm:flex-initial"
            >
              <RefreshCw className="w-4 h-4" /> Regenerate Itinerary
            </Button>

            {saveSuccess && activeTrip && activeTrip.id !== 0 && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleShare}
                  disabled={shareLoading}
                  className="flex-1 sm:flex-initial"
                  title="Copy shareable read-only public itinerary link"
                >
                  <Share2 className="w-4 h-4" /> {shareLoading ? 'Sharing...' : 'Share'}
                </Button>

                <Button
                  variant="secondary"
                  onClick={downloadPDF}
                  className="flex-1 sm:flex-initial"
                  title="Download premium PDF copy"
                >
                  <FileText className="w-4 h-4" /> PDF
                </Button>

                <Button
                  variant="secondary"
                  onClick={downloadCalendar}
                  className="flex-1 sm:flex-initial"
                  title="Sync travel schedule to Apple, Google or Outlook calendar"
                >
                  <CalendarRange className="w-4 h-4" /> Calendar Sync
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    const stored = localStorage.getItem(`voira_trip_versions_${activeTrip.id}`);
                    setVersionsList(stored ? JSON.parse(stored) : []);
                    setShowVersionPanel(true);
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <Clock className="w-4 h-4" /> Versions
                </Button>
              </>
            )}

            {saveSuccess && (
              <Link
                to="/chat"
                state={{ activeTrip }}
                className="btn-primary p-2 w-10 h-10"
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
          
          {/* Left: Timeline & Bookings */}
          <div className="lg:col-span-8 space-y-12">
            <ItineraryCard dailyPlan={plan.dailyItinerary} destination={activeTrip.destination} />

            {/* Recommended Flights Section */}
            {flightsLoading ? (
              <div className="itinerary-section">
                <div className="itinerary-section__header">
                  <span className="itinerary-section__icon"><Plane className="w-5 h-5" /></span>
                  <h3 className="itinerary-section__title">Recommended Flights</h3>
                  <span className="itinerary-section__count">Loading...</span>
                </div>
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] p-4 flex flex-col gap-4">
                  <div className="h-20 skeleton rounded-[var(--radius-sm)]" />
                  <div className="h-20 skeleton rounded-[var(--radius-sm)]" />
                </div>
              </div>
            ) : flights.length > 0 && (
              <div className="itinerary-section">
                <div className="itinerary-section__header">
                  <span className="itinerary-section__icon"><Plane className="w-5 h-5" /></span>
                  <h3 className="itinerary-section__title">Recommended Flights</h3>
                  <span className="itinerary-section__count">{flights.length} options</span>
                </div>
                
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--color-border-subtle)] flex justify-end bg-[var(--color-bg-hover)]">
                    <div className="flight-sort !mb-0">
                      <span>Sort by:</span>
                      <button 
                        className={`sort-btn ${flightSortKey === 'price' ? 'active' : ''}`}
                        onClick={() => setFlightSortKey('price')}
                      >Price ↑</button>
                      <button 
                        className={`sort-btn ${flightSortKey === 'duration' ? 'active' : ''}`}
                        onClick={() => setFlightSortKey('duration')}
                      >Duration</button>
                      <button 
                        className={`sort-btn ${flightSortKey === 'departure' ? 'active' : ''}`}
                        onClick={() => setFlightSortKey('departure')}
                      >Departure</button>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {[...flights].map(f => {
                      // Demo data injection if missing
                      return {
                        ...f,
                        durationMinutes: f.durationMinutes || (f.airline === 'IndiGo' ? 150 : f.airline === 'Air India' ? 100 : 110),
                        baggage: f.baggage || (f.airline === 'Air India' ? "23kg included" : "15kg"),
                        cancellation: f.cancellation || (f.airline === 'IndiGo' ? "Non-refundable" : "Free cancel 24h"),
                        trend: f.trend || (f.airline === 'IndiGo' ? 'pricier' : f.airline === 'Air India' ? 'cheaper' : 'neutral'),
                        trendText: f.trendText || (f.airline === 'IndiGo' ? '↑ ₹300 vs last week' : f.airline === 'Air India' ? '↓ ₹150 vs yesterday' : '→ Same price for 3 days'),
                        isBestValue: f.airline === 'Vistara',
                        isRecommended: f.airline === 'Air India'
                      };
                    }).sort((a, b) => {
                      switch(flightSortKey) {
                        case 'price': return a.price - b.price;
                        case 'duration': return a.durationMinutes - b.durationMinutes;
                        case 'departure': return a.departure.localeCompare(b.departure);
                        default: return 0;
                      }
                    }).map((flight, idx) => {
                      const isBooked = bookings.some(b => b.booking_type === 'Flight' && b.provider_name === flight.airline && b.details?.flightNumber === flight.flightNumber);
                      return (
                        <FlightRow 
                          key={flight.flightNumber + idx}
                          flight={flight}
                          isBooked={isBooked}
                          isSelected={selectedFlightId === flight.flightNumber}
                          isDimmed={selectedFlightId !== null && selectedFlightId !== flight.flightNumber}
                          onSelect={() => setSelectedFlightId(selectedFlightId === flight.flightNumber ? null : flight.flightNumber)}
                          onBook={() => handleBook('Flight', flight.airline, flight.price, { flightNumber: flight.flightNumber, departure: flight.departure, arrival: flight.arrival })}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Hotels recommendations list */}
            <div className="itinerary-section">
              <div className="itinerary-section__header flex-wrap">
                <span className="itinerary-section__icon"><Building2 className="w-5 h-5" /></span>
                <h3 className="itinerary-section__title">Smart Hotel Matches</h3>
                <span className="itinerary-section__count">{plan.hotelRecommendations.length} stays</span>
                
                <div className="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-4 flex bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-1 shadow-[var(--shadow-xs)]">
                  <button
                    onClick={() => setHotelViewMode('list')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all select-none ${
                      hotelViewMode === 'list'
                        ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-transparent'
                    }`}
                  >
                    List View
                  </button>
                  <button
                    onClick={() => setHotelViewMode('map')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all select-none ${
                      hotelViewMode === 'map'
                        ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-transparent'
                    }`}
                  >
                    Map View
                  </button>
                </div>
              </div>

              {hotelViewMode === 'list' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plan.hotelRecommendations.map((hotel, index) => {
                    const isBooked = bookings.some(b => b.booking_type === 'Hotel' && b.provider_name === hotel.name);
                    return (
                      <HotelCard 
                        key={index} 
                        hotel={hotel} 
                        index={index}
                        isBooked={isBooked}
                        onBook={() => {
                          const price = typeof hotel.pricePerNight === 'number' 
                            ? hotel.pricePerNight 
                            : parseInt(String(hotel.pricePerNight).replace(/[^0-9]/g, '')) || 0;
                          handleBook('Hotel', hotel.name, price, hotel);
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-[450px] w-full rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] shadow-[var(--shadow-sm)]">
                  <MapWidget
                    destination={activeTrip.destination}
                    items={plan.hotelRecommendations.map(hotel => ({
                      name: hotel.name,
                      category: 'Hotel' as const,
                      price: hotel.pricePerNight,
                      rating: hotel.rating,
                      lat: hotel.name.includes("Taj Exotica") ? 15.1733 : hotel.name.includes("Lemon Tree") ? 15.5536 : 15.1648,
                      lng: hotel.name.includes("Taj Exotica") ? 73.9561 : hotel.name.includes("Lemon Tree") ? 73.7716 : 73.9491
                    }))}
                    focusedIndex={null}
                    onMarkerClick={() => {}}
                    height="450px"
                  />
                </div>
              )}
            </div>

            {/* Attractions category view */}
            <div className="itinerary-section">
              <div className="itinerary-section__header">
                <span className="itinerary-section__icon"><MapPin className="w-5 h-5" /></span>
                <h3 className="itinerary-section__title">Must-Visit Attractions</h3>
                <span className="itinerary-section__count">{plan.attractions.length} places</span>
              </div>
              <AttractionCard attractions={plan.attractions} />
            </div>
          </div>

          {/* Right: Sidebar Panel with Tabs */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-sm)] sticky top-24">
              <div className="sidebar-tabs px-2 pt-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)]">
                <button 
                  className={`sidebar-tab ${activeTab === 'budget' ? 'active' : ''}`}
                  onClick={() => setActiveTab('budget')}
                >
                  Budget
                </button>
                <button 
                  className={`sidebar-tab ${activeTab === 'packing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('packing')}
                >
                  Packing
                </button>
                <button 
                  className={`sidebar-tab ${activeTab === 'tips' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tips')}
                >
                  Tips
                </button>
              </div>

              <div className={`sidebar-panel ${activeTab === 'budget' ? 'active' : ''} p-6 space-y-8 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin`}>
                <BudgetChart breakdown={plan.budgetBreakdown} targetBudget={activeTrip.budget} />

                {/* Budget Co-pilot widget */}
                {budgetCopilot && (
                  <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 space-y-4 text-left shadow-[var(--shadow-xs)]">
                    <h4 className="font-semibold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                      💡 Budget Co-pilot
                    </h4>
                    
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {budgetCopilot.comment}
                    </p>

                    {budgetCopilot.flags && budgetCopilot.flags.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {budgetCopilot.flags.map((flag, fIdx: number) => (
                          <div key={fIdx} className="p-2.5 rounded bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 text-xs flex justify-between items-center">
                            <span className="font-semibold text-[var(--color-text-primary)]">{flag.category}</span>
                            <span className="font-bold text-[var(--color-accent)]">
                              Spent: {formatCurrency(flag.spent)} / Planned: {formatCurrency(flag.planned)} (+{flag.deviation}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {budgetCopilot.recommendations && budgetCopilot.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
                        <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider">Recommendations</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {budgetCopilot.recommendations.map((rec: string, rIdx: number) => (
                            <li key={rIdx} className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Bookings & Tickets panel */}
                {activeTrip && activeTrip.id !== 0 && (
                  <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-5 shadow-[var(--shadow-xs)] space-y-4">
                    <h4 className="font-semibold text-base text-[var(--color-text-primary)] flex items-center gap-2">
                      🎟️ Booked Tickets
                    </h4>
                    {bookings.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-secondary)] py-2">
                        No active flight or hotel tickets purchased for this trip yet. Use the booking matches to checkout.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <div key={booking.id} className="p-4 bg-[var(--color-bg-hover)] rounded-md border border-[var(--color-border)] text-xs space-y-2 relative group/item hover:shadow-[var(--shadow-sm)] transition-all">
                            <div className="flex justify-between items-center">
                              <Badge type={booking.booking_type === 'Flight' ? 'direct' : 'recommender'} label={booking.booking_type} />
                              <span className={`font-semibold ${
                                booking.status === 'Cancelled' 
                                  ? 'text-[var(--color-error)]' 
                                  : booking.payment_status === 'Paid' 
                                    ? 'text-[var(--color-success)]' 
                                    : 'text-[var(--color-warning)]'
                              }`}>
                                {booking.status === 'Cancelled' ? 'Cancelled' : booking.payment_status}
                              </span>
                            </div>
                            
                            <div>
                              <span className="font-semibold text-[var(--color-text-primary)] block text-xs truncate">{booking.provider_name}</span>
                              <span className="text-xs text-[var(--color-text-secondary)] font-mono block mt-1">Ref: {booking.booking_reference || 'Pending'}</span>
                            </div>

                            {booking.confirmation_id && (
                              <p className="text-xs text-[var(--color-success)] font-semibold bg-[var(--color-success-bg)] px-2 py-1 rounded-sm inline-block">
                                Conf ID: {booking.confirmation_id}
                              </p>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-subtle)]">
                              <span className="font-semibold text-[var(--color-accent)] font-mono">{formatCurrency(booking.price)}</span>
                              
                              {booking.status !== 'Cancelled' ? (
                                <button
                                  disabled={cancelLoading === booking.id}
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="text-[11px] font-bold text-[var(--color-error)] hover:underline"
                                >
                                  {cancelLoading === booking.id ? 'Cancelling...' : 'Cancel Reservation'}
                                </button>
                              ) : (
                                booking.refund_status !== 'None' && (
                                  <span className="text-xs text-[var(--color-text-secondary)] italic font-normal">
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
              </div>

              <div className={`sidebar-panel ${activeTab === 'packing' ? 'active' : ''} p-6 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin`}>
                <PackingList 
                  destination={activeTrip.destination}
                  weatherCondition={plan.dailyItinerary?.[0]?.weather || 'Sunny'}
                  interests={activeTrip.interests}
                />
              </div>

              <div className={`sidebar-panel ${activeTab === 'tips' ? 'active' : ''} p-6 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin`}>
                <TravelTips 
                  destination={activeTrip.destination} 
                  startDate="2026-06-12"
                />
              </div>
            </div>
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
                  size="lg"
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
                <Badge type="recommender" label="Secure Redirect" />
                <h3 className="text-2xl font-sans font-semibold text-textPrimary dark:text-warmWhite mt-2">
                  Book this {checkoutItem.type.toLowerCase()}
                </h3>
              </div>

              {!paymentResult ? (
                <div className="space-y-6">
                  <div className="p-comfortable bg-stoneMuted dark:bg-dark-card rounded-md border border-stoneMuted dark:border-dark-border space-y-4">
                    <p className="text-sm text-textSecondary dark:text-dark-text-muted leading-relaxed">
                      You're about to be redirected to <strong>{checkoutItem.provider}</strong>'s official booking page to complete your reservation. Voira will save your selection to your itinerary.
                    </p>
                    <div className="flex justify-between items-start pt-4 border-t border-stoneMuted/30">
                      <div>
                        <h4 className="font-semibold text-sm text-textPrimary dark:text-warmWhite">{checkoutItem.provider}</h4>
                        <span className="text-xs text-textSecondary block font-normal mt-1">
                          {checkoutItem.type} {checkoutItem.details?.flightNumber || ''}
                        </span>
                      </div>
                      <span className="text-base font-semibold text-[#1E293B] dark:text-dark-text font-mono">{formatCurrency(checkoutItem.price)}</span>
                    </div>
                  </div>

                  {checkoutLoading ? (
                    <div className="text-center py-6 space-y-4">
                      <div className="w-10 h-10 rounded-lg border-2 border-stoneMuted border-t-primary animate-spin mx-auto" />
                      <p className="text-xs text-textSecondary dark:text-dark-text-muted">Preparing secure redirect...</p>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={executeCheckoutPayment}
                      className="w-full"
                    >
                      Continue to {checkoutItem.provider} →
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12 bg-[var(--color-bg-page)]">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="page-title">
            Hi, {(user?.name === 'Investor Guest' ? 'Guest' : (user?.name?.split(' ')[0] || 'User'))}!
          </h2>
          <p className="text-[var(--color-text-secondary)] text-base">
            {savedTrips.length === 0 
              ? "Where are you going next?" 
              : "Ready for your next adventure?"}
          </p>
        </div>
        <Link
          to="/planner"
          className="btn-primary h-11 px-8"
        >
          <Plus className="w-4 h-4" /> Plan a New Trip
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mb-4">
            <Compass className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Total Trips</p>
          <h3 className="stat-number text-[var(--color-text-primary)] mt-1">{totalTrips}</h3>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] text-[var(--color-success)] flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Allocated Budget</p>
          <h3 className="budget-amount text-[var(--color-text-primary)] mt-1 truncate">{formatCurrency(totalBudget)}</h3>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center mb-4">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Travel Days</p>
          <h3 className="stat-number text-[var(--color-text-primary)] mt-1">{totalDays}</h3>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--color-text-muted)]">Destinations</p>
          <h3 className="stat-number text-[var(--color-text-primary)] mt-1">{uniqueDestinations}</h3>
        </div>
      </div>

      {/* Saved Trips Lists */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="section-headline text-xl">Your Travel History</h3>
          {totalTrips > 0 && (
            <Link to="/saved-trips" className="text-sm font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
              View List <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {savedTrips.length === 0 ? (
          <div className="text-center py-20 bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border)] rounded-[var(--radius-xl)] p-12 shadow-[var(--shadow-sm)]">
            <Sparkles className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-4" />
            <h4 className="font-semibold text-[var(--color-text-primary)] text-lg">No adventures planned yet</h4>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-6 max-w-sm mx-auto">
              Ready to travel? Let our AI travel coordinator prepare a bespoke plan for you.
            </p>
            <Link
              to="/planner"
              className="btn-cta"
            >
              Start Trip Planner
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedTrips.slice(0, 3).map((trip) => (
              <div 
                key={trip.id} 
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 hover:shadow-[var(--shadow-md)] hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between group cursor-pointer relative shadow-[var(--shadow-sm)]"
                onClick={() => navigate('/dashboard/trip', { state: { trip } })}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <Badge type="duration" label={`${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}`} />
                    <button
                      onClick={(e) => handleDeleteTrip(trip.id, e)}
                      aria-label="Delete trip"
                      className="p-2 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] opacity-0 group-hover:opacity-100 transition-all duration-200 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
                      title="Delete trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="trip-name line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                    {trip.destination}
                  </h4>
                  
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] flex items-center gap-1.5 mt-2 font-medium">
                    <MapPin className="w-4 h-4 text-[var(--color-primary)]" /> From {trip.source}
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-6 border-t border-[var(--color-border-subtle)] pt-6 text-[var(--text-xs)]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">Budget</span>
                      <span className="price text-[var(--color-accent)]">{formatCurrency(trip.budget)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">Travelers</span>
                      <span className="font-bold text-[var(--color-text-primary)]">{trip.travelers} Guests</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 flex justify-end">
                  <span className="btn-ghost text-[var(--color-primary)] font-bold group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent flex items-center gap-1">
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

