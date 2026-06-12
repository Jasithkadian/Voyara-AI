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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-8 font-sans bg-[var(--color-bg-page)]">
      {/* Sub-Navigation Tab Bar */}
      <div className="border-b border-[var(--color-border)]">
        <div className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`pb-4 text-[var(--text-xs)] font-bold uppercase tracking-widest border-b-2 transition-all relative ${
                activeTab === tab.id
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
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
            <h2 className="page-title">Saved Trips</h2>
            <p className="text-base text-[var(--color-text-secondary)] mt-1">
              Browse and manage all your saved travel plans, itineraries, and chat sessions.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[var(--color-error-border)] font-semibold">
              {error}
            </div>
          )}

          {trips.length === 0 ? (
            <div className="max-w-5xl mx-auto py-12 flex items-center justify-center">
              <EmptyState type="no-saved-trips" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate('/dashboard/trip', { state: { trip } })}
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 hover:shadow-[var(--shadow-md)] hover:-translate-y-1 active:scale-[0.99] transition-all flex flex-col justify-between group cursor-pointer relative shadow-[var(--shadow-sm)]"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <Badge type="duration" label={`${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}`} />
                      <button
                        onClick={(e) => handleDeleteTrip(trip.id, e)}
                        className="p-2 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="trip-name group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                      {trip.destination}
                    </h3>
                    
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

                    {trip.interests && trip.interests.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-1.5">
                        {trip.interests.slice(0, 3).map((interest, idx) => (
                          <span key={idx} className="text-[10px] font-bold uppercase tracking-tight bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] px-2.5 py-1 rounded-[var(--radius-xs)] border border-[var(--color-border)]">
                            #{interest.replace('_', ' ')}
                          </span>
                        ))}
                        {trip.interests.length > 3 && (
                          <span className="text-[10px] text-[var(--color-text-muted)] font-bold px-2 py-1">
                            +{trip.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-4 flex justify-end">
                    <span className="btn-ghost text-[var(--color-primary)] font-bold group-hover:translate-x-1 transition-transform p-0 hover:bg-transparent">
                      View full plan <ArrowRight className="w-4 h-4" />
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
