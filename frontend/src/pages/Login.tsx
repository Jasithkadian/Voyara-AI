import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Plane, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-mesh">
      <div className="relative w-full max-w-md bg-warmWhite/80 dark:bg-dark-card backdrop-blur-md rounded-lg p-12 border border-stoneMuted dark:border-dark-border shadow-2xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-lg blur-2xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-coral/10 rounded-lg blur-2xl -ml-20 -mb-20"></div>

        <div className="text-center mb-12 relative">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-primary to-coral flex items-center justify-center text-warmWhite mx-auto shadow-md shadow-primary/10 mb-4">
            <Plane className="w-6 h-6 -rotate-45" />
          </div>
          <h2 className="text-3xl font-semibold text-textSecondary dark:text-warmWhite">Sign In</h2>
          <p className="text-xs text-textSecondary dark:text-dark-text-muted mt-1">
            Access your itineraries and AI travel copilot.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 rounded-lg bg-coral dark:bg-coral/20 text-coral dark:text-coral text-xs font-semibold border border-coral dark:border-coral/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="space-y-1">
            <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-4 bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg text-textSecondary dark:text-warmWhite focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-textSecondary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold  tracking-normal text-textSecondary dark:text-dark-text-muted flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-4 bg-stoneMuted dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg text-textSecondary dark:text-warmWhite focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-textSecondary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-lg font-semibold bg-primary text-warmWhite hover:bg-primary shadow-md shadow-primary/20 disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-textSecondary dark:text-dark-text-muted">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
