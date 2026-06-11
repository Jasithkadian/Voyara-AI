import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripsApi, SavedTrip } from '../services/api';
import { User, Mail, Calendar, Compass, LogOut, Shield, Wallet, Save, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlacePhoto } from '../hooks/usePlacePhoto';

interface ProfileCollageItemProps {
  destinationName: string;
}

const ProfileCollageItem: React.FC<ProfileCollageItemProps> = ({ destinationName }) => {
  const { photo, loading } = usePlacePhoto(destinationName, 'destination');
  if (loading) {
    return <div className="flex-1 h-full bg-stoneMuted/30 dark:bg-dark-muted/40 animate-pulse min-w-[60px]" />;
  }
  return (
    <img
      src={photo}
      alt={destinationName}
      className="w-full h-full object-cover object-center flex-1 brightness-[0.75] hover:scale-105 hover:brightness-[0.9] transition-all duration-500 min-w-[60px]"
    />
  );
};

export const Profile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [tripCount, setTripCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const navigate = useNavigate();

  // Preference State
  const [travelStyle, setTravelStyle] = useState('Relaxation');
  const [budgetRange, setBudgetRange] = useState('Mid-Range');
  const [favoriteDestinations, setFavoriteDestinations] = useState('');
  const [preferredHotels, setPreferredHotels] = useState('');
  const [foodPreferences, setFoodPreferences] = useState('');
  const [preferredActivities, setPreferredActivities] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    fetchProfileData();
  }, [isAuthenticated, navigate]);

  const fetchProfileData = async () => {
    try {
      const trips = await tripsApi.getHistory();
      setSavedTrips(trips);
      setTripCount(trips.length);
      setTotalSpent(trips.reduce((sum, t) => sum + t.budget, 0));
      setTotalDays(trips.reduce((sum, t) => sum + t.days, 0));

      const profile = await tripsApi.getProfile();
      if (profile) {
        setTravelStyle(profile.travel_style || 'Relaxation');
        setBudgetRange(profile.budget_range || 'Mid-Range');
        setFavoriteDestinations(profile.favorite_destinations?.join(', ') || '');
        setPreferredHotels(profile.preferred_hotels?.join(', ') || '');
        setFoodPreferences(profile.food_preferences?.join(', ') || '');
        setPreferredActivities(profile.preferred_activities?.join(', ') || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setMsg('');
    setError('');
    
    const payload = {
      travel_style: travelStyle,
      budget_range: budgetRange,
      favorite_destinations: favoriteDestinations.split(',').map(s => s.trim()).filter(Boolean),
      preferred_hotels: preferredHotels.split(',').map(s => s.trim()).filter(Boolean),
      food_preferences: foodPreferences.split(',').map(s => s.trim()).filter(Boolean),
      preferred_activities: preferredActivities.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      await tripsApi.updateProfile(payload);
      setMsg('Travel preferences saved successfully! Future AI itineraries will be personalized using this information.');
      setTimeout(() => setMsg(''), 6000);
    } catch (err) {
      setError('Failed to save preferences.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Messages */}
      {msg && (
        <div className="p-4 bg-successSage dark:bg-successSage/20 text-successSage dark:text-successSage rounded-md border border-successSage dark:border-successSage/50 text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 shrink-0 animate-pulse" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-coral dark:bg-coral/20 text-coral dark:text-coral rounded-md border border-coral dark:border-coral/50 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg overflow-hidden shadow-sm">
        {/* Cover header */}
        <div className="h-32 relative overflow-hidden bg-warmWhite dark:bg-dark-card border-b border-stoneMuted/50 dark:border-dark-border/50">
          {savedTrips.length > 0 ? (
            <div className="absolute inset-0 flex flex-row w-full h-full overflow-hidden">
              {savedTrips.slice(0, 5).map((trip, idx) => (
                <div key={trip.id || idx} className="flex-1 h-full relative border-r last:border-r-0 border-warmWhite/15 overflow-hidden">
                  <ProfileCollageItem destinationName={trip.destination} />
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-[9px] uppercase tracking-wider text-warmWhite rounded font-bold pointer-events-none select-none">
                    {trip.destination.split(',')[0]}
                  </div>
                </div>
              ))}
              <div className="absolute inset-0 bg-black/15 pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#1A1A2E] flex items-center justify-center overflow-hidden">
              <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 800 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M-50,150 C100,80 250,220 400,120 C550,20 700,160 850,90" fill="none" stroke="#0A84FF" strokeWidth="2.5" />
                <path d="M-50,170 C110,100 260,240 410,140 C560,40 710,180 860,110" fill="none" stroke="#0A84FF" strokeWidth="1.5" />
                <path d="M-50,130 C90,60 240,200 390,100 C540,0 690,140 840,70" fill="none" stroke="#0A84FF" strokeWidth="1.5" />
                <path d="M-50,190 C120,120 270,260 420,160 C570,60 720,200 870,130" fill="none" stroke="#FF6F61" strokeWidth="1" />
                <path d="M-50,110 C80,40 230,180 380,80 C530,-20 680,120 830,50" fill="none" stroke="#0A84FF" strokeWidth="1" />
                <circle cx="150" cy="80" r="3" fill="#FF6F61" />
                <circle cx="450" cy="140" r="3" fill="#0A84FF" />
                <circle cx="650" cy="60" r="3" fill="#FF6F61" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-coral/10" />
              <span className="relative z-10 text-[10px] font-semibold text-warmWhite/40 uppercase tracking-widest pointer-events-none select-none">
                Voira AI • Explore the Unexplored
              </span>
            </div>
          )}
          <div className="absolute -bottom-12 left-8 z-20">
            <div className="w-24 h-24 rounded-md bg-warmWhite dark:bg-dark-card p-2 shadow-sm border border-stoneMuted/40 dark:border-dark-border/40">
              <div className="w-full h-full rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-3xl shadow-inner">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-20 p-12 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-textSecondary dark:text-warmWhite">{user?.name}</h2>
              <p className="text-sm text-textSecondary dark:text-dark-text-muted">
                {tripCount} {tripCount === 1 ? 'trip' : 'trips'} planned · {totalDays} {totalDays === 1 ? 'day' : 'days'} traveled
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-coral/10 hover:bg-coral/20 text-coral dark:text-coral font-semibold rounded-sm flex items-center gap-2 text-xs transition-colors border border-coral/20"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-stoneMuted dark:border-dark-border">
            <div className="flex items-center space-x-4 text-textSecondary dark:text-dark-text-muted">
              <Mail className="w-5 h-5 text-textSecondary" />
              <div>
                <span className="text-xs text-textSecondary block  font-semibold tracking-normal">Email</span>
                <span className="text-sm font-semibold">{user?.email}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-textSecondary dark:text-dark-text-muted">
              <Calendar className="w-5 h-5 text-textSecondary" />
              <div>
                <span className="text-xs text-textSecondary block  font-semibold tracking-normal">Member Since</span>
                <span className="text-sm font-semibold">{formatDate(user?.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-stoneMuted dark:border-dark-border">
            <div className="bg-stoneMuted dark:bg-dark-card p-6 rounded-md border border-stoneMuted dark:border-dark-border">
              <Compass className="w-5 h-5 text-primary mb-2" />
              <span className="text-xs text-textSecondary dark:text-dark-text-muted block  font-semibold">Trips Saved</span>
              <span className="text-xl font-semibold text-textSecondary dark:text-warmWhite">{tripCount}</span>
            </div>

            <div className="bg-stoneMuted dark:bg-dark-card p-6 rounded-md border border-stoneMuted dark:border-dark-border">
              <Wallet className="w-5 h-5 text-successSage mb-2" />
              <span className="text-xs text-textSecondary dark:text-dark-text-muted block  font-semibold">Total Budget Plan</span>
              <span className="text-xl font-semibold text-coral font-mono truncate block">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TRAVEL PREFERENCES FORM */}
      <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-12 shadow-sm space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-textSecondary dark:text-warmWhite flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Personalize Travel Preferences
          </h3>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">
            Setting preferences here optimizes all generated daily itineraries, dining recommendations, and budget options automatically.
          </p>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Travel Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted">Travel Style</label>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
                className="w-full px-4 py-4 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-warmWhite text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Adventure">🧗 Adventure & Hikes</option>
                <option value="Relaxation">🧘 Relaxation & Spa</option>
                <option value="Culture">🏛️ Culture & Museums</option>
                <option value="Food">🍕 Culinary & Street Food</option>
                <option value="Shopping">🛍️ Luxury Shopping</option>
              </select>
            </div>

            {/* Budget Range */}
            <div className="space-y-2">
              <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted">Budget Range</label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-4 py-4 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-warmWhite text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Budget">Budget (Hostels / Street Food)</option>
                <option value="Mid-Range">Mid-Range (Standard hotels / Bistro dining)</option>
                <option value="Luxury">Luxury (5-star resorts / Fine dining)</option>
              </select>
            </div>

            {/* Food Preferences */}
            <div className="space-y-2">
              <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted">Dietary Preferences</label>
              <input
                type="text"
                value={foodPreferences}
                onChange={(e) => setFoodPreferences(e.target.value)}
                placeholder="e.g. Vegetarian, Halal, Vegan, Gluten-Free"
                className="w-full px-4 py-4 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-warmWhite text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary"
              />
            </div>

            {/* Favorite Hotels */}
            <div className="space-y-2">
              <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted">Preferred Lodging Styles</label>
              <input
                type="text"
                value={preferredHotels}
                onChange={(e) => setPreferredHotels(e.target.value)}
                placeholder="e.g. Boutique Hotels, Beachfront, Hostels, Taj"
                className="w-full px-4 py-4 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-warmWhite text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferred Activities */}
            <div className="space-y-2">
              <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted">Preferred Activities</label>
              <input
                type="text"
                value={preferredActivities}
                onChange={(e) => setPreferredActivities(e.target.value)}
                placeholder="e.g. Snorkeling, Art Galleries, Wine Tasting, Nightclubs"
                className="w-full px-4 py-4 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-warmWhite text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary"
              />
            </div>

            {/* Favorite Destinations */}
            <div className="space-y-2">
              <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted">Dream Destinations</label>
              <input
                type="text"
                value={favoriteDestinations}
                onChange={(e) => setFavoriteDestinations(e.target.value)}
                placeholder="e.g. Bali, Paris, Tokyo, Switzerland"
                className="w-full px-4 py-4 rounded-sm bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-warmWhite text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-textSecondary"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-stoneMuted dark:border-dark-border">
            <div className="flex items-center space-x-2 text-xs text-textSecondary dark:text-dark-text-muted">
              <Shield className="w-4 h-4 text-successSage" />
              <span>Secure storage. We do not sell preference profiles.</span>
            </div>
            
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-4 bg-primary text-warmWhite font-semibold rounded-sm shadow-md shadow-primary/15 hover:bg-primary flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
