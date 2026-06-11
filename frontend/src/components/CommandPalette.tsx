import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, Briefcase, Globe, MessageSquare, Settings, Keyboard, PlayCircle, PlusCircle, X } from 'lucide-react';
import { tripsApi, SavedTrip } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CommandPalette: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Load trips index once on mount or when search palette opens
    const loadTrips = async () => {
      try {
        setLoadingTrips(true);
        const data = await tripsApi.getHistory();
        setTrips(data);
      } catch (err) {
        console.error('Failed to load trips for command palette:', err);
      } finally {
        setLoadingTrips(false);
      }
    };

    loadTrips();
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.getAttribute('contenteditable') === 'true';

      // 1. Toggle palette: K or Ctrl+K / Cmd+K
      if ((e.key.toLowerCase() === 'k' && !isInput) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setShowShortcuts(false);
      }

      // 2. Toggle shortcuts: ?
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        setIsOpen(false);
      }

      // 3. New Trip: N
      if (e.key.toLowerCase() === 'n' && !isInput && !isOpen && !showShortcuts) {
        e.preventDefault();
        navigate('/planner');
      }

      // 4. Focus Search: /
      if (e.key === '/' && !isInput && !isOpen && !showShortcuts) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }

      // 5. Close: Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isOpen, showShortcuts]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleTripClick = (trip: SavedTrip) => {
    navigate('/dashboard/trip', { state: { trip } });
    setIsOpen(false);
  };

  // Static commands list
  const commands = [
    { label: 'Plan a New Trip', action: () => handleNavigate('/planner'), icon: PlusCircle, category: 'Actions', shortcut: 'N' },
    { label: 'View Saved Itineraries', action: () => handleNavigate('/saved-trips'), icon: Briefcase, category: 'Navigation', shortcut: '⌘T' },
    { label: 'Launch Demo Itinerary', action: () => handleNavigate('/demo'), icon: Globe, category: 'Navigation', shortcut: '⌘D' },
    { label: 'Chat with AI Assistant', action: () => handleNavigate('/chat'), icon: MessageSquare, category: 'Navigation', shortcut: '⌘C' },
    { label: 'Edit Travel Preferences', action: () => handleNavigate('/profile'), icon: Settings, category: 'Navigation', shortcut: '⌘S' },
  ];

  // Filter commands and trips
  const filteredCommands = commands.filter(c => 
    c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTrips = trips.filter(t => 
    t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* COMMAND PALETTE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-start justify-center pt-24 px-4">
          <div 
            ref={paletteRef} 
            className="w-full max-w-lg bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans text-left animate-fade-in"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-comfortable border-b border-stoneMuted/50 dark:border-dark-border">
              <Search className="w-5 h-5 text-textSecondary shrink-0 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips, pages, actions... (Esc to close)"
                className="w-full py-4 bg-transparent text-textPrimary dark:text-dark-text text-sm focus:outline-none placeholder:text-textSecondary"
              />
              <span className="text-[10px] bg-stoneMuted/40 dark:bg-dark-muted text-textSecondary px-1.5 py-0.5 rounded font-mono select-none">ESC</span>
            </div>

            {/* Results Body */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-4">
              {/* Commands Section */}
              {filteredCommands.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest px-3 py-1">Commands</h4>
                  <div className="space-y-0.5 mt-1">
                    {filteredCommands.map((cmd, idx) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={idx}
                          onClick={cmd.action}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary transition-all text-textPrimary dark:text-dark-text group text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className="w-4 h-4 text-textSecondary group-hover:text-primary shrink-0" />
                            <span>{cmd.label}</span>
                          </div>
                          {cmd.shortcut && (
                            <span className="text-[10px] text-textSecondary dark:text-dark-text-muted font-mono">{cmd.shortcut}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trips Section */}
              {isAuthenticated && (
                <div>
                  <h4 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest px-3 py-1">Saved Trips</h4>
                  {loadingTrips && trips.length === 0 ? (
                    <p className="text-xs text-textSecondary px-3 py-2 italic">Loading saved trips...</p>
                  ) : filteredTrips.length > 0 ? (
                    <div className="space-y-0.5 mt-1">
                      {filteredTrips.slice(0, 5).map((trip) => (
                        <button
                          key={trip.id}
                          onClick={() => handleTripClick(trip)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary transition-all text-textPrimary dark:text-dark-text group text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <Briefcase className="w-4 h-4 text-textSecondary group-hover:text-primary shrink-0" />
                            <div>
                              <span>Trip to {trip.destination}</span>
                              <span className="text-[10px] text-textSecondary block font-normal mt-0.5">From {trip.source} • {trip.days} Days</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-coral font-bold font-mono">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(trip.budget)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    searchQuery && <p className="text-xs text-textSecondary px-3 py-2 italic">No trips matched your search.</p>
                  )}
                </div>
              )}

              {filteredCommands.length === 0 && filteredTrips.length === 0 && (
                <div className="text-center py-6 text-xs text-textSecondary dark:text-dark-text-muted">
                  No matches found for "{searchQuery}"
                </div>
              )}
            </div>

            {/* Bottom Footer Help Bar */}
            <div className="bg-stoneMuted/20 dark:bg-dark-card border-t border-stoneMuted/50 dark:border-dark-border p-3 flex justify-between items-center text-[11px] text-textSecondary">
              <span className="flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5" /> Keyboard Shortcuts
              </span>
              <button 
                onClick={() => { setIsOpen(false); setShowShortcuts(true); }}
                className="text-primary hover:underline font-semibold"
              >
                Press ? to view legend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS INSTRUCTIONS MODAL */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div 
            ref={paletteRef} 
            className="w-full max-w-sm bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-xl shadow-2xl p-6 flex flex-col font-sans text-left animate-fade-in relative"
          >
            <button 
              onClick={() => setShowShortcuts(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-stoneMuted dark:hover:bg-dark-muted text-textSecondary"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <h3 className="text-base font-bold text-textPrimary dark:text-dark-text mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-primary" /> Keyboard Shortcuts Legend
            </h3>

            <div className="space-y-3 divide-y divide-stoneMuted/30 dark:divide-dark-border/40">
              <div className="flex justify-between items-center pt-2 first:pt-0">
                <span className="text-xs text-textSecondary dark:text-dark-text-muted">Open Command Menu</span>
                <kbd className="px-2 py-1 bg-stoneMuted/40 dark:bg-dark-muted text-textSecondary font-mono text-[11px] rounded shadow-xs border border-stoneMuted/60 dark:border-dark-border/50">K</kbd>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-xs text-textSecondary dark:text-dark-text-muted">Focus Command Search</span>
                <kbd className="px-2 py-1 bg-stoneMuted/40 dark:bg-dark-muted text-textSecondary font-mono text-[11px] rounded shadow-xs border border-stoneMuted/60 dark:border-dark-border/50">/</kbd>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-xs text-textSecondary dark:text-dark-text-muted">Start a New Trip</span>
                <kbd className="px-2 py-1 bg-stoneMuted/40 dark:bg-dark-muted text-textSecondary font-mono text-[11px] rounded shadow-xs border border-stoneMuted/60 dark:border-dark-border/50">N</kbd>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-xs text-textSecondary dark:text-dark-text-muted">Toggle Shortcuts Guide</span>
                <kbd className="px-2 py-1 bg-stoneMuted/40 dark:bg-dark-muted text-textSecondary font-mono text-[11px] rounded shadow-xs border border-stoneMuted/60 dark:border-dark-border/50">?</kbd>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-xs text-textSecondary dark:text-dark-text-muted">Close Menus / Modals</span>
                <kbd className="px-2 py-1 bg-stoneMuted/40 dark:bg-dark-muted text-textSecondary font-mono text-[11px] rounded shadow-xs border border-stoneMuted/60 dark:border-dark-border/50">ESC</kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcuts(false)}
              className="mt-6 w-full py-2.5 bg-primary text-warmWhite font-semibold rounded-md text-xs hover:bg-primary/95 transition-all text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
