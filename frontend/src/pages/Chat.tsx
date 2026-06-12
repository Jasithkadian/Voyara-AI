import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip } from '../services/api';
import { ChatWindow } from '../components/ChatWindow';
import { MessageSquare, Compass, ArrowLeft, ChevronRight, Sparkles } from 'lucide-react';

export const Chat: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchTrips();
  }, [isAuthenticated]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getHistory();
      setSavedTrips(data);
      
      // Check if trip was passed in route state
      const stateTrip = location.state?.activeTrip as SavedTrip | null;
      if (stateTrip) {
        // Find match in fetched list or use state
        const match = data.find(t => t.id === stateTrip.id);
        setSelectedTrip(match || stateTrip);
      } else if (data.length > 0) {
        // Default to first saved trip
        setSelectedTrip(data[0]);
      }
    } catch (err) {
      setError('Could not retrieve saved trips.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-lg border-4 border-stoneMuted border-t-brand animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-6 bg-[var(--color-bg-page)]">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-[var(--color-bg-card)] p-6 border border-[var(--color-border)] rounded-[var(--radius-lg)]">
        <div>
          <Link to="/dashboard" className="btn-ghost mb-2 -ml-3.5">
            ← Back to Dashboard
          </Link>
          <h2 className="page-title">AI Travel Assistant</h2>
        </div>
        
        {/* Dropdown to switch trip contexts */}
        {savedTrips.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-[var(--text-xs)] text-[var(--color-text-secondary)] font-bold uppercase tracking-wider hidden md:inline">Trip Context:</span>
            <select
              value={selectedTrip?.id || ''}
              onChange={(e) => {
                const match = savedTrips.find(t => t.id === Number(e.target.value));
                setSelectedTrip(match || null);
              }}
              className="px-4 py-2 text-[var(--text-xs)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-primary)] font-bold focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer"
            >
              {savedTrips.map(trip => (
                <option key={trip.id} value={trip.id}>
                  {trip.destination} ({trip.days} Days)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {savedTrips.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-20 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-12 shadow-[var(--shadow-sm)]">
          <MessageSquare className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
          <h4 className="font-semibold text-[var(--color-text-primary)] text-lg">No active trips for chat</h4>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-6 leading-relaxed">
            You need at least one saved trip to chat with the AI Travel Copilot. The assistant uses your specific destination, budget, and activities as context!
          </p>
          <Link
            to="/planner"
            className="btn-primary"
          >
            Create a Trip Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Chat Window Column */}
          <div className="lg:col-span-8">
            {selectedTrip && (
              <ChatWindow tripId={selectedTrip.id} destination={selectedTrip.destination} />
            )}
          </div>

          {/* Context Details Summary Side Panel */}
          <div className="lg:col-span-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 space-y-6">
            <h3 className="font-bold text-[var(--text-xs)] text-[var(--color-text-primary)] uppercase tracking-widest flex items-center gap-2 border-b border-[var(--color-border-subtle)] pb-4">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" /> Context Summary
            </h3>
            
            {selectedTrip && (
              <div className="space-y-4 text-[var(--text-xs)]">
                <div>
                  <span className="text-[var(--color-text-muted)] font-bold uppercase tracking-wider block mb-1">Destination</span>
                  <span className="font-semibold text-[var(--color-text-primary)] text-sm">{selectedTrip.destination}</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] font-bold uppercase tracking-wider block mb-1">Source</span>
                  <span className="font-semibold text-[var(--color-text-secondary)]">{selectedTrip.source}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[var(--color-text-muted)] font-bold uppercase tracking-wider block mb-1">Budget Limit</span>
                    <span className="price text-[var(--color-text-primary)]">{formatCurrency(selectedTrip.budget)}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)] font-bold uppercase tracking-wider block mb-1">Travelers</span>
                    <span className="font-semibold text-[var(--color-text-secondary)]">{selectedTrip.travelers} Persons</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                  <span className="text-[var(--color-text-muted)] font-bold uppercase tracking-wider block mb-3">Itinerary Preview</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedTrip.generated_plan.dailyItinerary.map(day => (
                      <div 
                        key={day.day} 
                        onClick={() => navigate('/dashboard/trip', { state: { trip: selectedTrip } })}
                        className="p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-active)] border border-[var(--color-border)] cursor-pointer flex justify-between items-center transition-all group"
                      >
                        <span className="font-bold text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)]">Day {day.day}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );

  function formatCurrency(val: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  }
};
