import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, Plane, User as UserIcon, LogOut, Compass, Briefcase, Bell } from 'lucide-react';
import { tripsApi } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, theme, toggleTheme, login, register } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const list = await tripsApi.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationsRead = async () => {
    try {
      await tripsApi.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
      setName('');
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="sticky top-0 z-40 w-full glass border-b border-slate-200/50 dark:border-neutral-800/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-accent flex items-center justify-center text-white shadow-md shadow-brand/20 group-hover:scale-105 transition-transform duration-300">
                <Plane className="-rotate-45 w-5.5 h-5.5" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
                Travel<span className="text-brand">Copilot</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-brand' 
                    : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                }`}
              >
                Home
              </Link>
              <Link
                to="/demo"
                className={`text-sm font-medium transition-colors ${
                  isActive('/demo') 
                    ? 'text-brand' 
                    : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                }`}
              >
                Demo Sandbox
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'text-brand' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/planner"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/planner') 
                        ? 'text-brand' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                    }`}
                  >
                    Plan Trip
                  </Link>
                  <Link
                    to="/saved-trips"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/saved-trips') 
                        ? 'text-brand' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                    }`}
                  >
                    Saved Trips
                  </Link>
                  <Link
                    to="/chat"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/chat') 
                        ? 'text-brand' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                    }`}
                  >
                    AI Chat
                  </Link>
                  <Link
                    to="/trip-timeline"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/trip-timeline') 
                        ? 'text-brand' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                    }`}
                  >
                    Timeline
                  </Link>
                  <Link
                    to="/my-expenses"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/my-expenses') 
                        ? 'text-brand' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                    }`}
                  >
                    Expenses
                  </Link>
                  <Link
                    to="/analytics"
                    className={`text-sm font-medium transition-colors ${
                      isActive('/analytics') 
                        ? 'text-brand' 
                        : 'text-slate-600 dark:text-neutral-300 hover:text-brand'
                    }`}
                  >
                    Analytics
                  </Link>
                </>
              ) : null}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notification Bell */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifDropdown(!showNotifDropdown);
                      if (!showNotifDropdown) {
                        handleNotificationsRead();
                      }
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 transition-colors relative"
                    title="Alerts"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.some(n => !n.is_read) && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    )}
                  </button>

                  {/* Dropdown Drawer */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl py-3 z-50 animate-fade-in max-h-96 overflow-y-auto">
                      <div className="px-4 pb-2 border-b border-slate-100 dark:border-neutral-850 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800 dark:text-white">Notifications</span>
                        <span className="text-[10px] text-slate-400">Smart Alerts</span>
                      </div>
                      
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-500 text-center py-6">No new notifications.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-neutral-850">
                          {notifications.map((n) => (
                            <div key={n.id} className={`p-3 text-xs leading-relaxed ${!n.is_read ? 'bg-brand/5' : ''}`}>
                              <div className="font-bold text-slate-800 dark:text-white">{n.title}</div>
                              <p className="text-slate-550 dark:text-neutral-400 mt-0.5">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 p-1.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 text-slate-500 transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsRegister(false);
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 rounded-xl font-medium bg-brand text-white hover:bg-brand-600 shadow-md shadow-brand/20 hover:shadow-lg transition-all duration-300"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden glass border-b border-slate-200 dark:border-neutral-800 px-4 pt-2 pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
            >
              Home
            </Link>
            <Link
              to="/demo"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
            >
              Demo Sandbox
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  Dashboard
                </Link>
                <Link
                  to="/planner"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  Plan Trip
                </Link>
                <Link
                  to="/saved-trips"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  Saved Trips
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  AI Chat
                </Link>
                <Link
                  to="/trip-timeline"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  Timeline
                </Link>
                <Link
                  to="/my-expenses"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  Expenses
                </Link>
                <Link
                  to="/analytics"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  Analytics
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200"
                >
                  Profile ({user?.name})
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsRegister(false);
                  setShowAuthModal(true);
                }}
                className="w-full px-4 py-2.5 rounded-xl font-medium bg-brand text-white hover:bg-brand-600"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm dark:bg-black/70 animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-slate-100 dark:border-neutral-850 shadow-2xl overflow-hidden">
            {/* Background decorative gradients */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h3>
              <p className="text-slate-500 dark:text-neutral-400 mt-1 text-sm">
                {isRegister ? 'Join us to plan your next dream vacation' : 'Sign in to access your travel plans'}
              </p>
            </div>

            {authError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-950/50">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 relative">
              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700/50 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700/50 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700/50 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 mt-2 rounded-xl font-semibold bg-brand text-white hover:bg-brand-600 shadow-md shadow-brand/20 hover:shadow-lg disabled:opacity-50 transition-all duration-300"
              >
                {authLoading ? 'Please wait...' : isRegister ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-neutral-400">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setIsRegister(false);
                      setAuthError('');
                    }}
                    className="text-brand font-semibold hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setIsRegister(true);
                      setAuthError('');
                    }}
                    className="text-brand font-semibold hover:underline"
                  >
                    Create one
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
