import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip } from '../services/api';
import { Calendar, Wallet, Users, MapPin, Trash2, ArrowRight, Compass, Sparkles } from 'lucide-react';

export const SavedTrips: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrips();
    } else {
      setLoading(false);
      navigate('/login');
    }
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

  const handleDeleteTrip = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await tripsApi.delete(id);
        setTrips(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        alert('Failed to delete trip.');
      }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Saved Trips</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-450">
          Browse and manage all your saved travel plans, itineraries, and chat sessions.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 rounded-2xl border border-red-100">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 border border-dashed border-slate-200 dark:border-neutral-800 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
          <Compass className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 dark:text-white text-lg">No trips saved yet</h4>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1 mb-6 leading-relaxed">
            Create an itinerary in our planner, then save it to see it here in your history folder.
          </p>
          <Link
            to="/planner"
            className="px-6 py-3.5 bg-brand text-white font-semibold rounded-2xl shadow-md hover:bg-brand-600 transition-all text-sm inline-block"
          >
            Create New Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => navigate('/dashboard/trip', { state: { trip } })}
              className="bg-white dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800/40 rounded-3xl p-6 hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer relative"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-brand/10 text-brand px-3 py-1 rounded-xl text-xs font-bold uppercase">
                    {trip.days} Days
                  </div>
                  <button
                    onClick={(e) => handleDeleteTrip(trip.id, e)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition-colors"
                    title="Delete Trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-xl text-slate-850 dark:text-white group-hover:text-brand transition-colors line-clamp-1">
                  {trip.destination}
                </h3>
                
                <p className="text-xs text-slate-550 dark:text-neutral-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> From {trip.source}
                </p>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-neutral-850 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-neutral-500 block mb-0.5 font-bold uppercase tracking-wider text-[9px]">Budget</span>
                    <span className="font-extrabold text-slate-700 dark:text-neutral-300">{formatCurrency(trip.budget)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-neutral-500 block mb-0.5 font-bold uppercase tracking-wider text-[9px]">Travelers</span>
                    <span className="font-extrabold text-slate-700 dark:text-neutral-300">{trip.travelers} Guests</span>
                  </div>
                </div>

                {trip.interests && trip.interests.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {trip.interests.slice(0, 3).map((interest, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 dark:bg-neutral-850 text-slate-650 dark:text-neutral-300 px-2 py-0.5 rounded-md">
                        #{interest.replace('_', ' ')}
                      </span>
                    ))}
                    {trip.interests.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5">
                        +{trip.interests.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 flex justify-end">
                <span className="text-xs font-semibold text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View full plan <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
