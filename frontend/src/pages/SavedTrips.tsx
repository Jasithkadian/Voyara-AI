import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip } from '../services/api';
import { Badge } from '../components/Badge';
import { MapPin, Trash2, ArrowRight, Compass } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

// Import sub-navigation page components
import { TripTimeline } from './TripTimeline';
import { Expenses } from './Expenses';
import { Analytics } from './Analytics';

interface SavedTripsProps {
  defaultTab?: 'list' | 'timeline' | 'expenses' | 'analytics';
}

export const SavedTrips: React.FC<SavedTripsProps> = ({ defaultTab = 'list' }) => {
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State
  const [activeTab, setActiveTab] = useState<'list' | 'timeline' | 'expenses' | 'analytics'>(defaultTab);

  // Undo Delete State
  const [undoTrip, setUndoTrip] = useState<SavedTrip | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrips();
    } else {
      setLoading(false);
      navigate('/login');
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (undoTimeoutId) {
        window.clearTimeout(undoTimeoutId);
      }
    };
  }, [isAuthenticated]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getHistory();
      setTrips(data);
    } catch (err) {
      setError('Could not fetch saved trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const tripToDelete = trips.find(t => t.id === id);
    if (!tripToDelete) return;

    // Execute previous pending deletion immediately if there is one
    if (undoTimeoutId) {
      window.clearTimeout(undoTimeoutId);
      if (undoTrip) {
        tripsApi.delete(undoTrip.id).catch(err => console.error(err));
      }
    }

    // Remove immediately from UI state
    setTrips(prev => prev.filter(t => t.id !== id));
    setUndoTrip(tripToDelete);
    setShowToast(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        await tripsApi.delete(id);
        setShowToast(false);
        setUndoTrip(null);
        setUndoTimeoutId(null);
      } catch (err) {
        console.error('Failed to delete trip from backend:', err);
      }
    }, 5000);

    setUndoTimeoutId(timeoutId as unknown as number);
  };

  const handleUndoDelete = () => {
    if (undoTimeoutId) {
      window.clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }
    if (undoTrip) {
      // Restore trip back to local state list
      setTrips(prev => [...prev, undoTrip].sort((a, b) => b.id - a.id));
      setUndoTrip(null);
    }
    setShowToast(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleTabChange = (tabId: 'list' | 'timeline' | 'expenses' | 'analytics') => {
    setActiveTab(tabId);
    if (tabId === 'list') navigate('/saved-trips');
    else if (tabId === 'timeline') navigate('/trip-timeline');
    else if (tabId === 'expenses') navigate('/my-expenses');
    else if (tabId === 'analytics') navigate('/analytics');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-lg border-4 border-stoneMuted border-t-brand animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'list', label: 'My Saved Trips' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'expenses', label: 'Expenses' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-8 font-sans">
      {/* Sub-Navigation Tab Bar */}
      <div className="border-b border-stoneMuted/60 dark:border-dark-border/60">
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary dark:text-dark-text-muted dark:hover:text-dark-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'list' && (
        <div className="space-y-12 animate-fade-in text-left">
          <div>
            <h2 className="text-3xl font-semibold text-textPrimary dark:text-warmWhite">Saved Trips</h2>
            <p className="text-sm text-textSecondary dark:text-dark-text-muted mt-1">
              Browse and manage all your saved travel plans, itineraries, and chat sessions.
            </p>
          </div>

          {error && (
            <div className="p-comfortable bg-coral dark:bg-coral/20 text-coral dark:text-coral rounded-md border border-coral">
              {error}
            </div>
          )}

          {trips.length === 0 ? (
            <div className="max-w-5xl mx-auto py-12 flex items-center justify-center">
              <EmptyState type="no-saved-trips" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate('/dashboard/trip', { state: { trip } })}
                  className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-md p-comfortable hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99] transition-all flex flex-col justify-between group cursor-pointer relative shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <Badge type="duration" label={`${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}`} />
                      <button
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        className="p-2 rounded-sm text-textSecondary hover:text-coral hover:bg-coral/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-sans font-semibold text-xl text-textPrimary dark:text-warmWhite group-hover:text-primary transition-colors line-clamp-1">
                      {trip.destination}
                    </h3>
                    
                    <p className="text-xs text-textSecondary dark:text-dark-text-muted flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4 text-primary" /> From {trip.source}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-stoneMuted dark:border-dark-border pt-4 text-xs">
                      <div>
                        <span className="text-textSecondary dark:text-dark-text-muted block mb-1 font-semibold tracking-normal">Budget</span>
                        <span className="font-semibold text-coral font-mono">{formatCurrency(trip.budget)}</span>
                      </div>
                      <div>
                        <span className="text-textSecondary dark:text-dark-text-muted block mb-1 font-semibold tracking-normal">Travelers</span>
                        <span className="font-semibold text-textPrimary dark:text-dark-text-muted">{trip.travelers} Guests</span>
                      </div>
                    </div>

                    {trip.interests && trip.interests.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {trip.interests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="text-xs bg-stoneMuted dark:bg-dark-card text-textSecondary dark:text-dark-text-muted px-2 py-1 rounded-sm">
                            #{interest.replace('_', ' ')}
                          </span>
                        ))}
                        {trip.interests.length > 3 && (
                          <span className="text-xs text-textSecondary font-semibold px-2 py-1">
                            +{trip.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 flex justify-end">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View full plan <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="animate-fade-in">
          <TripTimeline />
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="animate-fade-in">
          <Expenses />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="animate-fade-in">
          <Analytics />
        </div>
      )}

      {/* Undo Delete Toast */}
      {showToast && undoTrip && (
        <div className="fixed bottom-6 right-6 bg-stoneMuted dark:bg-dark-card text-textPrimary dark:text-dark-text border border-stoneMuted/80 dark:border-dark-border/80 px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center justify-between gap-6 animate-fade-in max-w-sm">
          <div className="text-xs text-left">
            <span className="text-textSecondary dark:text-dark-text-muted">Trip to </span>
            <span className="font-bold text-coral">{undoTrip.destination}</span>
            <span className="text-textSecondary dark:text-dark-text-muted"> deleted.</span>
          </div>
          <button
            onClick={handleUndoDelete}
            className="text-xs font-bold text-primary hover:text-primary/90 underline transition-colors shrink-0"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
};
