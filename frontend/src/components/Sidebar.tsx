import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Briefcase, Globe, MessageSquare, Settings, Sun, Moon, LogOut, Plane, Bell } from 'lucide-react';
import { tripsApi } from '../services/api';
import { useCurrency, CurrencyCode } from '../context/CurrencyContext';

export const Sidebar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const list = await tripsApi.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch notifications in Sidebar:', err);
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/saved-trips') {
      return location.pathname === '/saved-trips' || location.pathname === '/trip-timeline' || location.pathname === '/my-expenses' || location.pathname === '/analytics';
    }
    return location.pathname === path;
  };

  const navItems = [
    { label: 'Plan Trip', path: '/planner', icon: Compass },
    { label: 'My Trips', path: '/saved-trips', icon: Briefcase },
    { label: 'Explore', path: '/demo', icon: Globe },
    { label: 'Assistant', path: '/chat', icon: MessageSquare },
    { label: 'Settings', path: '/profile', icon: Settings },
  ];

  const { currency, setCurrency } = useCurrency();
  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <aside className="w-[240px] shrink-0 h-screen sticky top-0 bg-warmWhite dark:bg-dark-card border-r border-stoneMuted/60 dark:border-dark-border/60 flex flex-col justify-between p-comfortable z-30 font-sans text-left">
      <div className="space-y-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 px-tight">
          <div className="w-9 h-9 rounded-md bg-gradient-to-tr from-primary to-coral flex items-center justify-center text-warmWhite shadow-md shadow-primary/20">
            <Plane className="-rotate-45 w-5 h-5" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-textPrimary to-textPrimary dark:from-dark-text dark:to-dark-text tracking-tight select-none">
            Voira<span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Primary Nav Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-comfortable py-3 rounded-md text-xs font-semibold tracking-wide transition-all border select-none ${
                  active
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 text-primary shadow-xs'
                    : 'bg-transparent border-transparent text-textSecondary hover:bg-stoneMuted/30 hover:text-textPrimary dark:text-dark-text-muted dark:hover:bg-dark-muted/40'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-primary' : 'text-textSecondary'}`} />
                  <span>{item.label}</span>
                </div>
                {item.path === '/saved-trips' && hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-4 border-t border-stoneMuted/50 dark:border-dark-border/50">
        {/* Alerts & Theme Actions */}
        <div className="flex items-center justify-between px-tight">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown) handleNotificationsRead();
              }}
              className="p-2 rounded-md bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text transition-colors relative"
              title="Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-coral border border-warmWhite dark:border-dark-card"></span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute left-0 bottom-12 w-72 bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg shadow-xl py-3 z-50 animate-fade-in max-h-80 overflow-y-auto">
                <div className="px-4 pb-2 border-b border-stoneMuted/50 dark:border-dark-border flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-textPrimary dark:text-dark-text">Notifications</span>
                  <span className="text-[10px] text-textSecondary">Smart Alerts</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-textSecondary text-center py-4">No alerts recorded.</p>
                ) : (
                  <div className="divide-y divide-stoneMuted/30 dark:divide-dark-border/40">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 text-[11px] leading-relaxed text-left ${!n.is_read ? 'bg-primary/5' : ''}`}>
                        <div className="font-semibold text-textPrimary dark:text-dark-text">{n.title}</div>
                        <p className="text-textSecondary dark:text-dark-text-muted mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md bg-stoneMuted/30 hover:bg-stoneMuted/50 dark:bg-dark-muted dark:hover:bg-dark-muted text-textPrimary dark:text-dark-text transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Currency Dropdown Selector */}
        <div className="flex items-center justify-between px-tight">
          <span className="text-[10px] uppercase font-bold text-textSecondary dark:text-dark-text-muted">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="px-2 py-1 text-[11px] rounded bg-stoneMuted/30 dark:bg-dark-muted border border-stoneMuted/50 dark:border-dark-border/50 text-textPrimary dark:text-warmWhite focus:outline-none cursor-pointer font-semibold"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
          </select>
        </div>


        {/* User Profile Block */}
        <div className="flex items-center justify-between p-2 rounded-md bg-stoneMuted/20 dark:bg-dark-muted/20 border border-stoneMuted/40 dark:border-dark-border/40">
          <Link to="/profile" className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-textPrimary dark:text-dark-text truncate leading-none">{user?.name}</p>
              <p className="text-[10px] text-textSecondary dark:text-dark-text-muted truncate mt-0.5">Premium Planner</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded text-textSecondary hover:text-coral hover:bg-coral/10 transition-all ml-1"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
