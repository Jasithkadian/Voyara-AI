import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip } from '../services/api';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
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
        <div className="w-12 h-12 rounded-lg border-4 border-stoneMuted border-t-brand animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 space-y-12">
      <div>
        <h2 className="text-3xl font-sans font-semibold text-textPrimary dark:text-warmWhite">Saved Trips</h2>
        <p className="text-sm text-textSecondary dark:text-dark-text-muted">
          Browse and manage all your saved travel plans, itineraries, and chat sessions.
        </p>
      </div>

      {error && (
        <div className="p-comfortable bg-coral dark:bg-coral/20 text-coral dark:text-coral rounded-md border border-coral">
          {error}
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-20 bg-warmWhite dark:bg-dark-card border border-dashed border-stoneMuted dark:border-dark-border rounded-md p-12 max-w-lg mx-auto shadow-sm">
          <Compass className="w-12 h-12 text-textSecondary mx-auto mb-4" />
          <h4 className="font-sans font-semibold text-textPrimary dark:text-warmWhite text-lg">No trips saved yet</h4>
          <p className="text-sm text-textSecondary dark:text-dark-text-muted mt-1 mb-6 leading-relaxed">
            Create an itinerary in our planner, then save it to see it here in your history folder.
          </p>
          <Link
            to="/planner"
            className="h-11 px-6 bg-primary text-warmWhite font-semibold rounded-sm shadow-sm hover:opacity-95 inline-flex items-center justify-center transition-all text-sm"
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
                    <span className="text-textSecondary dark:text-dark-text-muted block mb-1 font-semibold  tracking-normal text-xs">Budget</span>
                    <span className="font-semibold text-coral font-mono">{formatCurrency(trip.budget)}</span>
                  </div>
                  <div>
                    <span className="text-textSecondary dark:text-dark-text-muted block mb-1 font-semibold  tracking-normal text-xs">Travelers</span>
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
  );
};
