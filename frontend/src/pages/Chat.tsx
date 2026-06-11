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
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-6 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl">
        <div>
          <Link to="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-brand flex items-center gap-1 mb-1.5">
            ← Back to Dashboard
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white">AI Travel Assistant</h2>
        </div>
        
        {/* Dropdown to switch trip contexts */}
        {savedTrips.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold hidden md:inline">Trip Context:</span>
            <select
              value={selectedTrip?.id || ''}
              onChange={(e) => {
                const match = savedTrips.find(t => t.id === Number(e.target.value));
                setSelectedTrip(match || null);
              }}
              className="px-4 py-2 text-xs bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
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
        <div className="max-w-md mx-auto text-center py-20 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
          <MessageSquare className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 dark:text-white text-lg">No active trips for chat</h4>
          <p className="text-sm text-slate-505 dark:text-neutral-400 mt-1 mb-6 leading-relaxed">
            You need at least one saved trip to chat with the AI Travel Copilot. The assistant uses your specific destination, budget, and activities as context!
          </p>
          <Link
            to="/planner"
            className="px-6 py-3 bg-brand text-white font-semibold rounded-2xl shadow-md hover:bg-brand-600 transition-all text-sm inline-block"
          >
            Create a Trip Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Chat Window Column */}
          <div className="lg:col-span-8">
            {selectedTrip && (
              <ChatWindow tripId={selectedTrip.id} destination={selectedTrip.destination} />
            )}
          </div>

          {/* Context Details Summary Side Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-neutral-850 pb-3">
              <Sparkles className="w-4 h-4 text-brand" /> Context Summary
            </h3>
            
            {selectedTrip && (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">Destination</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">{selectedTrip.destination}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-neutral-500 block mb-0.5">Source</span>
                  <span className="font-bold text-slate-700 dark:text-neutral-350">{selectedTrip.source}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-450 dark:text-neutral-500 block">Budget Limit</span>
                    <span className="font-bold text-slate-700 dark:text-neutral-350">{formatCurrency(selectedTrip.budget)}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 dark:text-neutral-500 block">Travelers</span>
                    <span className="font-bold text-slate-700 dark:text-neutral-350">{selectedTrip.travelers} Persons</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-neutral-500 block mb-2 font-bold uppercase tracking-wider">Itinerary Preview</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedTrip.generated_plan.dailyItinerary.map(day => (
                      <div 
                        key={day.day} 
                        onClick={() => navigate('/dashboard/trip', { state: { trip: selectedTrip } })}
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-neutral-850 dark:hover:bg-neutral-800 border border-slate-100 dark:border-neutral-800/80 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <span className="font-bold text-slate-700 dark:text-neutral-300">Day {day.day}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
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
