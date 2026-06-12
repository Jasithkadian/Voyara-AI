import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Briefcase, Globe, MessageSquare, Settings, Sun, Moon, LogOut, Bell } from 'lucide-react';
import { Logo } from './Logo';
import { tripsApi } from '../services/api';
import { useCurrency, CurrencyCode } from '../context/CurrencyContext';
import { NotificationItem } from './Navbar';

export const Sidebar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchNotifications = async () => {
    try {
      const list = await tripsApi.getNotifications();
      setNotifications(list);
    } catch {
      // Ignored
    }
  };

  const handleNotificationsRead = async () => {
    try {
      await tripsApi.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/saved-trips') {
      return location.pathname === '/saved-trips' || location.pathname === '/trip-timeline' || location.pathname === '/my-expenses';
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
    <aside className="sidebar w-[240px] shrink-0 h-screen sticky top-0 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)] flex flex-col justify-between p-6 z-30 font-sans text-left">
      <div className="space-y-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center px-tight">
          <Logo className="h-7 text-[#0A1628] dark:text-warmWhite" />
        </Link>

        {/* Primary Nav Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${active ? 'active' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.path === '/saved-trips' && hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-[var(--color-error)] animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
        {/* Alerts & Theme Actions */}
        <div className="flex items-center justify-between px-tight">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                if (!showNotifDropdown) handleNotificationsRead();
              }}
              className="p-2 rounded-md bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-active)] text-[var(--color-text-primary)] transition-colors relative"
              title="Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[var(--color-error)] border border-[var(--color-bg-sidebar)]"></span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute left-0 bottom-12 w-72 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg py-3 z-50 animate-fade-in max-h-80 overflow-y-auto">
                <div className="px-4 pb-2 border-b border-[var(--color-border-subtle)] flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]">Notifications</span>
                  <span className="text-[10px] text-[var(--color-text-secondary)]">Smart Alerts</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">No alerts recorded.</p>
                ) : (
                  <div className="divide-y divide-[var(--color-border-subtle)]">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 text-[11px] leading-relaxed text-left ${!n.is_read ? 'bg-[var(--color-primary-light)]' : ''}`}>
                        <div className="font-semibold text-[var(--color-text-primary)]">{n.title}</div>
                        <p className="text-[var(--color-text-secondary)] mt-0.5">{n.message}</p>
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
            className="p-2 rounded-md bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-active)] text-[var(--color-text-primary)] transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Currency Dropdown Selector */}
        <div className="flex items-center justify-between px-tight">
          <span className="text-[10px] uppercase font-bold text-[var(--color-text-secondary)]">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="px-2 py-1 text-[11px] rounded bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none cursor-pointer font-semibold"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
          </select>
        </div>


        {/* User Profile Block */}
        <div className="flex items-center justify-between p-2 rounded-md bg-[var(--color-bg-hover)] border border-[var(--color-border)]">
          <Link to="/profile" className="flex items-center space-x-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-md bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
              {(user?.name === 'Investor Guest' ? 'Guest User' : (user?.name || user?.email?.split('@')[0] || 'U')).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-[var(--color-text-primary)] truncate leading-none">
                {user?.name === 'Investor Guest' ? 'Guest User' : (user?.name || user?.email?.split('@')[0] || 'User')}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Log Out"
            className="p-2 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-all ml-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-error)]"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
