import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User as UserIcon, Plane } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
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
      await register({ name, email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gradient-mesh">
      <div className="relative w-full max-w-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-3xl p-8 border border-slate-200/50 dark:border-neutral-800/40 shadow-2xl overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

        <div className="text-center mb-8 relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center text-white mx-auto shadow-md shadow-brand/10 mb-4">
            <Plane className="w-6 h-6 -rotate-45" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-850 dark:text-white">Create Account</h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Join to plan and save your dream travel itineraries.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 text-xs font-semibold border border-red-100 dark:border-red-950/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-405 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-405 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-405 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-800/60 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl font-bold bg-brand text-white hover:bg-brand-600 shadow-md shadow-brand/20 disabled:opacity-50 transition-all duration-300"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-550 dark:text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-semibold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};
