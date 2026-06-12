import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Menu, X, LogOut, Bell } from 'lucide-react';
import { tripsApi } from '../services/api';
import { useCurrency, CurrencyCode } from '../context/CurrencyContext';

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, theme, toggleTheme, login, register, loginGuest } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  async function fetchNotifications() {
    try {
      const list = await tripsApi.getNotifications();
      setNotifications(list);
    } catch {
      // Ignored
    }
  }

  async function handleNotificationsRead() {
    try {
      await tripsApi.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // Ignored
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 0);
      const interval = setInterval(() => {
        fetchNotifications();
      }, 20000);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isAuthenticated]);

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
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setAuthError(error.response?.data?.detail || 'Authentication failed. Please try again.');
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
      <nav className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-white/70 backdrop-blur-md dark:bg-[#0a0a0c]/70 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <span className="font-display text-2xl font-bold text-[var(--color-text-primary)] tracking-tighter">V <span className="font-ui text-xl font-semibold tracking-normal">voira</span></span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-all px-2 py-1 ${
                  isActive('/') 
                    ? 'text-[var(--color-primary)]' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Home
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/demo"
                  className={`text-sm font-medium transition-all px-2 py-1 ${
                    isActive('/demo') 
                      ? 'text-[var(--color-primary)]' 
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  Explore
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`text-sm font-medium transition-all px-2 py-1 ${
                      isActive('/dashboard') 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/planner"
                    className={`text-sm font-medium transition-all px-2 py-1 ${
                      isActive('/planner') 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Plan Trip
                  </Link>
                  <Link
                    to="/saved-trips"
                    className={`text-sm font-medium transition-all px-2 py-1 ${
                      isActive('/saved-trips') 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Saved Trips
                  </Link>
                  <Link
                    to="/chat"
                    className={`text-sm font-medium transition-all px-2 py-1 ${
                      isActive('/chat') 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    AI Chat
                  </Link>
                  <Link
                    to="/trip-timeline"
                    className={`text-sm font-medium transition-all px-2 py-1 ${
                      isActive('/trip-timeline') 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Timeline
                  </Link>
                  <Link
                    to="/my-expenses"
                    className={`text-sm font-medium transition-all px-2 py-1 ${
                      isActive('/my-expenses') 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Expenses
                  </Link>
                  <Link
                    to="/analytics"
                    className={`text-sm font-medium transition-all px-2 py-1 ${
                      isActive('/analytics') 
                        ? 'text-[var(--color-primary)]' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Analytics
                  </Link>
                </>
              ) : null}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Currency Dropdown Selector */}
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="px-2 py-1 text-xs rounded bg-stoneMuted/30 dark:bg-dark-muted border border-stoneMuted/50 dark:border-dark-border/50 text-textPrimary dark:text-warmWhite focus:outline-none cursor-pointer font-semibold"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
              </select>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-sm bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text transition-colors"
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
                    className="p-2 rounded-sm bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text transition-colors relative"
                    title="Alerts"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.some(n => !n.is_read) && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-lg bg-coral animate-ping"></span>
                    )}
                  </button>

                  {/* Dropdown Drawer */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-md shadow-card-hover py-4 z-50 animate-fade-in max-h-96 overflow-y-auto">
                      <div className="px-4 pb-2 border-b border-stoneMuted/50 dark:border-dark-border flex justify-between items-center">
                        <span className="text-xs font-semibold text-textPrimary dark:text-dark-text">Notifications</span>
                        <span className="text-xs text-textSecondary">Smart Alerts</span>
                      </div>
                      
                      {notifications.length === 0 ? (
                        <p className="text-xs text-textSecondary text-center py-6">No new notifications.</p>
                      ) : (
                        <div className="divide-y divide-stoneMuted/50 dark:divide-dark-border">
                          {notifications.map((n) => (
                            <div key={n.id} className={`p-4 text-xs leading-relaxed ${!n.is_read ? 'bg-primary/5' : ''}`}>
                              <div className="font-semibold text-textPrimary dark:text-dark-text">{n.title}</div>
                              <p className="text-textSecondary dark:text-dark-text-muted mt-1">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 p-2 px-4 rounded-sm hover:bg-stoneMuted/30 dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text transition-colors"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-normal max-w-[100px] truncate">{user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-sm hover:bg-coral hover:text-coral dark:hover:bg-coral/30 text-textSecondary transition-colors"
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
                  className="h-9 px-4 rounded-sm font-semibold bg-primary text-warmWhite hover:opacity-95 active:scale-[0.98] transition-all text-xs flex items-center justify-center"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-sm bg-stoneMuted/30 dark:bg-dark-muted text-textPrimary dark:text-dark-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                className="p-2 rounded-sm bg-stoneMuted/30 dark:bg-dark-muted text-textPrimary dark:text-dark-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden glass border-b border-stoneMuted dark:border-dark-border px-4 pt-2 pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={isActive('/') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
            >
              Home
            </Link>
            {!isAuthenticated && (
              <Link
                to="/demo"
                onClick={() => setIsOpen(false)}
                className={isActive('/demo') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
              >
                Demo Sandbox
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/dashboard') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  Dashboard
                </Link>
                <Link
                  to="/planner"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/planner') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  Plan Trip
                </Link>
                <Link
                  to="/saved-trips"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/saved-trips') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  Saved Trips
                </Link>
                <Link
                  to="/chat"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/chat') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  AI Chat
                </Link>
                <Link
                  to="/trip-timeline"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/trip-timeline') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  Timeline
                </Link>
                <Link
                  to="/my-expenses"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/my-expenses') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  Expenses
                </Link>
                <Link
                  to="/analytics"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/analytics') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  Analytics
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className={isActive('/profile') ? 'block px-4 py-2 rounded-sm text-sm font-semibold text-primary bg-primary/5 border-l-[3px] border-primary dark:bg-primary/10' : 'block px-4 py-2 rounded-sm text-sm font-semibold text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted'}
                >
                  Profile ({user?.name})
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 rounded-sm text-sm font-semibold text-coral hover:bg-coral dark:hover:bg-coral/20"
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
                className="w-full px-4 py-2 rounded-sm font-semibold bg-primary text-warmWhite hover:opacity-95 active:scale-[0.98] transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-textPrimary/60 backdrop-blur-sm dark:bg-textPrimary/70 animate-fade-in">
          <div className="relative w-full max-w-md bg-warmWhite dark:bg-dark-card rounded-lg p-12 border border-stoneMuted/50 dark:border-dark-border shadow-2xl overflow-hidden">
            {/* Background decorative gradients */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-lg blur-2xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-coral/10 rounded-lg blur-2xl -ml-20 -mb-20"></div>

            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 p-2 rounded-lg hover:bg-stoneMuted/30 dark:hover:bg-dark-muted text-textSecondary hover:text-textPrimary dark:hover:text-dark-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 text-center">
              <h3 className="text-2xl font-semibold text-textPrimary dark:text-dark-text">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h3>
              <p className="text-textSecondary dark:text-dark-text-muted mt-1 text-sm">
                {isRegister ? 'Join us to plan your next dream vacation' : 'Sign in to access your travel plans'}
              </p>
            </div>

            {authError && (
              <div className="p-4 mb-4 rounded-sm bg-coral dark:bg-coral/30 text-coral dark:text-coral text-xs font-normal border border-coral dark:border-coral/50">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 relative">
              {isRegister && (
                <div>
                  <label className="block text-xs font-normal text-textSecondary dark:text-dark-text-muted mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-4 bg-warmWhite dark:bg-dark-muted/50 border border-stoneMuted dark:border-dark-border/50 rounded-sm text-textPrimary dark:text-dark-text placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-normal text-textSecondary dark:text-dark-text-muted mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-4 bg-warmWhite dark:bg-dark-muted/50 border border-stoneMuted dark:border-dark-border/50 rounded-sm text-textPrimary dark:text-dark-text placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-textSecondary dark:text-dark-text-muted mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-4 bg-warmWhite dark:bg-dark-muted/50 border border-stoneMuted dark:border-dark-border/50 rounded-sm text-textPrimary dark:text-dark-text placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-4 mt-2 rounded-sm font-semibold bg-primary text-warmWhite hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {authLoading ? 'Please wait...' : isRegister ? 'Sign Up' : 'Sign In'}
              </button>

              {!isRegister && (
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={async () => {
                    setAuthError('');
                    setAuthLoading(true);
                    try {
                      await loginGuest();
                      setShowAuthModal(false);
                      setEmail('');
                      setPassword('');
                      setName('');
                      navigate('/dashboard');
                    } catch {
                      setAuthError('Guest login failed. Please try again.');
                    } finally {
                      setAuthLoading(false);
                    }
                  }}
                  className="w-full py-4 mt-3 rounded-sm font-semibold border border-stoneMuted dark:border-dark-border text-textSecondary dark:text-dark-text-muted hover:bg-stoneMuted/30 dark:hover:bg-dark-muted/30 transition-all duration-300"
                >
                  Continue as Guest
                </button>
              )}
            </form>

            <div className="mt-6 text-center text-sm text-textSecondary dark:text-dark-text-muted">
              {isRegister ? (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setIsRegister(false);
                      setAuthError('');
                    }}
                    className="text-primary font-semibold hover:underline"
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
                    className="text-primary font-semibold hover:underline"
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
