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
    <div className="min-h-[85vh] py-20 px-4 bg-gradient-mesh flex items-center justify-center">
      <div className="w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-textSecondary dark:text-warmWhite flex items-center justify-center gap-2">
            <Compass className="w-8 h-8 text-primary animate-spin-slow" /> Voira AI Trip Planner
          </h2>
          <p className="text-sm text-textSecondary dark:text-dark-text-muted mt-1">
            Let artificial intelligence design your custom holiday itinerary and budget.
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-6 flex items-center gap-4 p-4 bg-coral dark:bg-coral/20 text-coral dark:text-coral border border-coral dark:border-coral/45 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-xs sm:text-sm font-semibold">{error}</p>
          </div>
        )}

        <TripForm onSubmit={handleFormSubmit} loading={loading} />
      </div>
    </div>
  );
};
