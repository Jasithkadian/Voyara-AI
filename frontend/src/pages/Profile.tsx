import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tripsApi } from '../services/api';
import { User, Mail, Calendar, Compass, LogOut, Shield, Wallet, Save, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [tripCount, setTripCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
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
      setTripCount(trips.length);
      setTotalSpent(trips.reduce((sum, t) => sum + t.budget, 0));

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
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Messages */}
      {msg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 shrink-0 animate-pulse" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl overflow-hidden shadow-xl">
        {/* Cover header */}
        <div className="h-32 bg-gradient-to-r from-brand to-accent relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-neutral-850 p-2 shadow-lg">
              <div className="w-full h-full rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-bold text-3xl">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-16 p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user?.name}</h2>
              <p className="text-sm text-slate-500 dark:text-neutral-400">Travel Explorer</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-550/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 font-bold rounded-xl flex items-center gap-1.5 text-xs transition-colors border border-red-500/20"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-neutral-850">
            <div className="flex items-center space-x-3 text-slate-650 dark:text-neutral-300">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Email</span>
                <span className="text-sm font-semibold">{user?.email}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-slate-650 dark:text-neutral-300">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-455 block uppercase font-bold tracking-wider">Member Since</span>
                <span className="text-sm font-semibold">{formatDate(user?.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-neutral-850">
            <div className="bg-slate-50 dark:bg-neutral-850 p-5 rounded-2xl border border-slate-150 dark:border-neutral-800/60">
              <Compass className="w-5 h-5 text-brand mb-2" />
              <span className="text-[10px] text-slate-450 dark:text-neutral-500 block uppercase font-bold">Trips Saved</span>
              <span className="text-xl font-extrabold text-slate-800 dark:text-white">{tripCount}</span>
            </div>

            <div className="bg-slate-50 dark:bg-neutral-850 p-5 rounded-2xl border border-slate-150 dark:border-neutral-800/60">
              <Wallet className="w-5 h-5 text-emerald-500 mb-2" />
              <span className="text-[10px] text-slate-450 dark:text-neutral-500 block uppercase font-bold">Total Budget Plan</span>
              <span className="text-xl font-extrabold text-slate-800 dark:text-white truncate block">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TRAVEL PREFERENCES FORM */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200/60 dark:border-neutral-800/60 rounded-3xl p-8 shadow-xl space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" /> Personalize Travel Preferences
          </h3>
          <p className="text-xs text-slate-500 dark:text-neutral-450 mt-1">
            Setting preferences here optimizes all generated daily itineraries, dining recommendations, and budget options automatically.
          </p>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Travel Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Travel Style</label>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Budget Range</label>
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="Budget">Budget (Hostels / Street Food)</option>
                <option value="Mid-Range">Mid-Range (Standard hotels / Bistro dining)</option>
                <option value="Luxury">Luxury (5-star resorts / Fine dining)</option>
              </select>
            </div>

            {/* Food Preferences */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Dietary Preferences</label>
              <input
                type="text"
                value={foodPreferences}
                onChange={(e) => setFoodPreferences(e.target.value)}
                placeholder="e.g. Vegetarian, Halal, Vegan, Gluten-Free"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-slate-400"
              />
            </div>

            {/* Favorite Hotels */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Preferred Lodging Styles</label>
              <input
                type="text"
                value={preferredHotels}
                onChange={(e) => setPreferredHotels(e.target.value)}
                placeholder="e.g. Boutique Hotels, Beachfront, Hostels, Taj"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferred Activities */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Preferred Activities</label>
              <input
                type="text"
                value={preferredActivities}
                onChange={(e) => setPreferredActivities(e.target.value)}
                placeholder="e.g. Snorkeling, Art Galleries, Wine Tasting, Nightclubs"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-slate-400"
              />
            </div>

            {/* Favorite Destinations */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Dream Destinations</label>
              <input
                type="text"
                value={favoriteDestinations}
                onChange={(e) => setFavoriteDestinations(e.target.value)}
                placeholder="e.g. Bali, Paris, Tokyo, Switzerland"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-neutral-850">
            <div className="flex items-center space-x-2 text-xs text-slate-450 dark:text-neutral-550">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Secure storage. We do not sell preference profiles.</span>
            </div>
            
            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-3.5 bg-brand text-white font-bold rounded-2xl shadow-md shadow-brand/15 hover:bg-brand-600 flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saveLoading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
