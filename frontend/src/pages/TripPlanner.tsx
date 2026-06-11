import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripForm } from '../components/TripForm';
import { LoadingState } from '../components/LoadingState';
import { tripsApi, TripGenerateInput } from '../services/api';
import { Compass, AlertCircle } from 'lucide-react';

export const TripPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormSubmit = async (data: TripGenerateInput) => {
    setLoading(true);
    setError('');
    try {
      const generatedPlan = await tripsApi.generate(data);
      // Redirect to the dedicated dashboard trip results view
      navigate('/dashboard/trip', { 
        state: { 
          generatedPlan, 
          originalInput: data 
        } 
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate your trip plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-gradient-mesh">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-16 px-4 bg-gradient-mesh flex items-center justify-center">
      <div className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white flex items-center justify-center gap-2">
            <Compass className="w-8 h-8 text-brand animate-spin-slow" /> AI Travel Copilot
          </h2>
          <p className="text-sm text-slate-500 dark:text-neutral-450 mt-1">
            Let artificial intelligence design your custom holiday itinerary and budget.
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-6 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-950/45 rounded-2xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{error}</p>
          </div>
        )}

        <TripForm onSubmit={handleFormSubmit} loading={loading} />
      </div>
    </div>
  );
};
